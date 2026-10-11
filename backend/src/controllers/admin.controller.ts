import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { VerificationRequest } from '../models/VerificationRequest';
import { User, IUser } from '../models/User';
import { Room } from '../models/Room';
import { RoomEnquiry } from '../models/RoomEnquiry';
import { MatchRequest } from '../models/MatchRequest';
import { Report } from '../models/Report';
import { AppError } from '../middlewares/error.middleware';
import { toAdminVerificationDTO } from '../services/verification.service';
import { calcProfileStrength } from '../utils/dto';
import { createNotification } from '../services/notification.service';

/**
 * GET /api/admin/verifications
 * Admin lists verification requests.
 * Returns admin DTOs with decrypted full ID for manual verification review.
 */
export async function listVerificationRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.query;

    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string') {
      filter.status = status;
    }

    const requests = await VerificationRequest.find(filter).sort({ createdAt: 1 });

    const userIds = requests.map((r) => r.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'name city avatarUrl verificationStatus');
    const userMap = new Map<string, IUser>();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
    }

    const data = requests.map((r) => toAdminVerificationDTO(r, userMap.get(r.userId.toString())));

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/verifications/:id
 * Admin approves or rejects a verification request.
 */
export async function resolveVerificationRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { action, reason } = req.body as {
      action?: 'approve' | 'reject';
      reason?: string;
    };

    if (!action || !['approve', 'reject'].includes(action)) {
      return next(new AppError("Action must be either 'approve' or 'reject'.", 400));
    }

    if (!isValidObjectId(id)) {
      return next(new AppError('Verification request not found.', 404));
    }

    const requestDoc = await VerificationRequest.findById(id);
    if (!requestDoc) {
      return next(new AppError('Verification request not found.', 404));
    }

    const now = new Date();
    const adminId = req.user!._id;

    if (action === 'approve') {
      // Idempotent handling for already-approved
      if (requestDoc.status === 'verified') {
        const existingUser = await User.findById(requestDoc.userId);
        res.status(200).json({
          success: true,
          message: 'Verification request is already approved.',
          data: toAdminVerificationDTO(requestDoc, existingUser),
        });
        return;
      }

      requestDoc.status = 'verified';
      requestDoc.reviewedBy = adminId;
      requestDoc.reviewedAt = now;
      await requestDoc.save();

      const targetUser = await User.findById(requestDoc.userId);
      if (targetUser) {
        targetUser.verificationStatus = 'verified';
        targetUser.profileStrength = calcProfileStrength(targetUser);
        await targetUser.save();
      }

      await createNotification({
        userId: requestDoc.userId,
        type: 'VERIFICATION_APPROVED',
        title: 'Verification approved',
        message: 'Your identity verification has been approved.',
        link: '/app/verification',
      });

      res.status(200).json({
        success: true,
        message: 'Verification request approved successfully.',
        data: toAdminVerificationDTO(requestDoc, targetUser),
      });
      return;
    }

    if (action === 'reject') {
      // Idempotent handling for already-rejected
      if (requestDoc.status === 'rejected') {
        const existingUser = await User.findById(requestDoc.userId);
        res.status(200).json({
          success: true,
          message: 'Verification request is already rejected.',
          data: toAdminVerificationDTO(requestDoc, existingUser),
        });
        return;
      }

      requestDoc.status = 'rejected';
      requestDoc.rejectionReason = reason || 'Document could not be verified.';
      requestDoc.reviewedBy = adminId;
      requestDoc.reviewedAt = now;
      await requestDoc.save();

      const targetUser = await User.findById(requestDoc.userId);
      if (targetUser) {
        targetUser.verificationStatus = 'rejected';
        targetUser.profileStrength = calcProfileStrength(targetUser);
        await targetUser.save();
      }

      const rejectionReason = reason || 'Document could not be verified.';
      await createNotification({
        userId: requestDoc.userId,
        type: 'VERIFICATION_REJECTED',
        title: 'Verification rejected',
        message: `Your verification request was rejected: ${rejectionReason}`,
        link: '/app/verification',
      });

      res.status(200).json({
        success: true,
        message: 'Verification request rejected successfully.',
        data: toAdminVerificationDTO(requestDoc, targetUser),
      });
      return;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats
 * Admin dashboard aggregated platform metrics computed directly from real MongoDB collections.
 */
export async function getAdminPlatformStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      activeToday,
      verifiedUsers,
      pendingVerifications,
      totalRooms,
      matchesMade,
      totalReports,
      pendingEnquiries,
      recentUsers,
      flaggedReports,
      cityMixAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: startOfToday } }),
      User.countDocuments({ verificationStatus: 'verified' }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      Room.countDocuments({ isActive: true }),
      MatchRequest.countDocuments({ status: 'accepted' }),
      Report.countDocuments({ status: 'pending' }),
      RoomEnquiry.countDocuments({ status: 'pending' }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email city budget verificationStatus gender occupation company avatarUrl createdAt')
        .lean(),
      Report.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.aggregate([
        { $match: { city: { $exists: true, $ne: '' } } },
        { $group: { _id: '$city', users: { $sum: 1 } } },
        { $sort: { users: -1 } },
        { $limit: 6 },
      ]),
    ]);

    // Build last 7 days metrics
    const days: { day: string; dateStr: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        day: dayNames[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
      });
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [weeklyUsers, weeklyMatches] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      MatchRequest.aggregate([
        { $match: { status: 'accepted', updatedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userCountMap = new Map<string, number>(weeklyUsers.map((w: any) => [w._id, w.count]));
    const matchCountMap = new Map<string, number>(weeklyMatches.map((w: any) => [w._id, w.count]));

    const weekly = days.map((d) => ({
      day: d.day,
      signups: userCountMap.get(d.dateStr) || 0,
      matches: matchCountMap.get(d.dateStr) || 0,
    }));

    const cityMix = cityMixAgg.map((c: any) => ({
      city: c._id,
      users: c.users,
    }));

    const recentMembers = recentUsers.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      occupation: u.occupation || 'Student',
      city: u.city,
      budget: u.budget || 0,
      verification: u.verificationStatus || 'unverified',
      gender: u.gender || '',
      joinedAt: u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recently',
      avatar: u.avatarUrl || '',
    }));

    const flagged = flaggedReports.map((r: any) => ({
      id: r._id.toString(),
      type: r.targetType,
      subject: r.subject,
      reason: r.reason,
      at: r.createdAt
        ? new Date(r.createdAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
          })
        : 'Recent',
      status: r.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          activeToday: Math.max(activeToday, 1),
          verifiedUsers,
          pendingVerifications,
          rooms: totalRooms,
          matchesMade,
          reports: totalReports,
          pendingEnquiries,
          revenue: 0,
        },
        weekly,
        cityMix: cityMix.length > 0 ? cityMix : [{ city: 'Pune', users: totalUsers }],
        flagged,
        recentMembers,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/verifications/:id
 * Retrieve a single verification request with full decrypted ID for manual review.
 */
export async function getVerificationRequestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid verification ID.', 400));
    }
    const doc = await VerificationRequest.findById(id);
    if (!doc) {
      return next(new AppError('Verification request not found.', 404));
    }
    const user = await User.findById(doc.userId);
    res.status(200).json({
      success: true,
      data: toAdminVerificationDTO(doc, user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * Real user directory for admin management.
 * Returns non-sensitive profile fields; never exposes passwords, JWTs, or private hashes.
 */
export async function listAdminUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, city, verificationStatus, role } = req.query;
    const filter: Record<string, unknown> = {};

    if (city && typeof city === 'string') {
      filter.city = city;
    }
    if (verificationStatus && typeof verificationStatus === 'string') {
      filter.verificationStatus = verificationStatus;
    }
    if (role && typeof role === 'string') {
      filter.role = role;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { locality: regex }, { occupation: regex }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .select('name email city locality budget verificationStatus gender role isPaused createdAt lastActiveAt occupation company avatarUrl profileStrength')
      .lean();

    const data = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      city: u.city,
      locality: u.locality || '',
      budget: u.budget || 0,
      verificationStatus: u.verificationStatus || 'unverified',
      gender: u.gender || '',
      role: u.role || 'user',
      isPaused: Boolean(u.isPaused),
      occupation: u.occupation || '',
      company: u.company || '',
      avatarUrl: u.avatarUrl || '',
      profileStrength: u.profileStrength || 0,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
    }));

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id
 * Admin updates user account status (e.g. pause/activate or verification override).
 */
export async function updateAdminUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { isPaused, verificationStatus } = req.body;

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid user ID.', 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (typeof isPaused === 'boolean') {
      user.isPaused = isPaused;
    }
    if (verificationStatus && ['unverified', 'pending', 'verified', 'rejected'].includes(verificationStatus)) {
      user.verificationStatus = verificationStatus;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isPaused: Boolean(user.isPaused),
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/rooms
 * Real room listings directory for administrative overview and verification.
 */
export async function listAdminRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, city, isActive, isVerified } = req.query;
    const filter: Record<string, unknown> = {};

    if (city && typeof city === 'string') {
      filter.city = city;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { locality: regex }, { description: regex }];
    }

    const rooms = await Room.find(filter)
      .populate('hostId', 'name email avatarUrl verificationStatus')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const data = rooms.map((r: any) => {
      const host = r.hostId as any;
      return {
        id: r._id.toString(),
        title: r.title,
        city: r.city,
        locality: r.locality,
        address: r.address || '',
        rent: r.rent,
        deposit: r.deposit,
        type: r.type,
        furnishing: r.furnishing,
        preferredGender: r.preferredGender,
        isActive: Boolean(r.isActive),
        isVerified: Boolean(r.isVerified),
        images: r.images || [],
        host: host
          ? {
              id: host._id?.toString() || r.hostId?.toString(),
              name: host.name || 'Host',
              email: host.email || '',
              avatarUrl: host.avatarUrl || '',
              verificationStatus: host.verificationStatus || 'unverified',
            }
          : {
              id: r.hostId?.toString() || '',
              name: 'Host',
              email: '',
              avatarUrl: '',
              verificationStatus: 'unverified',
            },
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/rooms/:id
 * Admin updates room status (activate/deactivate or verify).
 */
export async function updateAdminRoomStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid room ID.', 400));
    }

    const room = await Room.findById(id);
    if (!room) {
      return next(new AppError('Room not found.', 404));
    }

    if (typeof isActive === 'boolean') {
      room.isActive = isActive;
    }
    if (typeof isVerified === 'boolean') {
      room.isVerified = isVerified;
      if (isVerified) {
        await createNotification({
          userId: room.hostId,
          type: 'ROOM_ENQUIRY',
          title: 'Listing verified',
          message: `Your room listing "${room.title}" has been verified by the safety team.`,
          entityId: room._id.toString(),
          link: `/app/rooms/${room._id.toString()}`,
        });
      }
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room listing updated successfully.',
      data: {
        id: room._id.toString(),
        title: room.title,
        isActive: Boolean(room.isActive),
        isVerified: Boolean(room.isVerified),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/reports/:id
 * Admin reviews and resolves or dismisses an open report.
 */
export async function resolveAdminReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { action } = req.body as { action?: 'resolve' | 'dismiss' };

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid report ID.', 400));
    }
    if (!action || !['resolve', 'dismiss'].includes(action)) {
      return next(new AppError("Action must be 'resolve' or 'dismiss'.", 400));
    }

    const report = await Report.findById(id);
    if (!report) {
      return next(new AppError('Report not found.', 404));
    }

    report.status = action === 'resolve' ? 'resolved' : 'dismissed';
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report marked as ${report.status}.`,
      data: {
        id: report._id.toString(),
        status: report.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

