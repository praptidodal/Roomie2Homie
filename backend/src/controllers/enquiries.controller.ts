import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { RoomEnquiry, IRoomEnquiry } from '../models/RoomEnquiry';
import { Room, IRoom } from '../models/Room';
import { User, IUser } from '../../models/User';
import { AppError } from '../middlewares/error.middleware';
import { createNotification } from '../services/notification.service';

export interface RoomSummaryDTO {
  id: string;
  title: string;
  city: string;
  locality: string;
  rent: number;
  image: string;
}

export interface UserSummaryDTO {
  id: string;
  name: string;
  avatarUrl: string;
  city?: string;
  occupation?: string;
  verificationStatus: string;
  verified: boolean;
}

export interface RoomEnquiryDTO {
  id: string;
  roomId: string;
  room?: RoomSummaryDTO;
  requesterId: string;
  requester?: UserSummaryDTO;
  hostId: string;
  host?: UserSummaryDTO;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  responseMessage?: string;
  createdAt: string;
  respondedAt?: string | null;
  updatedAt: string;
}

export function toEnquiryDTO(
  enquiry: IRoomEnquiry,
  room?: IRoom | null,
  requester?: IUser | null,
  host?: IUser | null
): RoomEnquiryDTO {
  return {
    id: enquiry._id.toString(),
    roomId: enquiry.roomId.toString(),
    room: room
      ? {
          id: room._id.toString(),
          title: room.title,
          city: room.city,
          locality: room.locality,
          rent: room.rent,
          image: Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : '',
        }
      : undefined,
    requesterId: enquiry.requesterId.toString(),
    requester: requester
      ? {
          id: requester._id.toString(),
          name: requester.name,
          avatarUrl: requester.avatarUrl || '',
          city: requester.city,
          occupation: requester.occupation || '',
          verificationStatus: requester.verificationStatus || 'unverified',
          verified: requester.verificationStatus === 'verified',
        }
      : undefined,
    hostId: enquiry.hostId.toString(),
    host: host
      ? {
          id: host._id.toString(),
          name: host.name,
          avatarUrl: host.avatarUrl || '',
          city: host.city,
          verificationStatus: host.verificationStatus || 'unverified',
          verified: host.verificationStatus === 'verified',
        }
      : undefined,
    message: enquiry.message,
    status: enquiry.status,
    responseMessage: enquiry.responseMessage || undefined,
    createdAt: enquiry.createdAt.toISOString(),
    respondedAt: enquiry.respondedAt ? enquiry.respondedAt.toISOString() : null,
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

/**
 * POST /api/rooms/:roomId/enquiries
 * Authenticated user creates an enquiry for an active room.
 */
export async function createRoomEnquiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return next(new AppError('Room listing not found.', 404));
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new AppError('Room listing not found.', 404));
    }

    if (!room.isActive) {
      return next(new AppError('This room listing is no longer active and cannot receive enquiries.', 400));
    }

    if (room.hostId.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot enquire about your own room listing.', 400));
    }

    const { message } = req.body as { message?: string };
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return next(new AppError('Please provide an enquiry message of at least 5 characters.', 400));
    }
    if (message.trim().length > 1000) {
      return next(new AppError('Enquiry message is too long (maximum 1000 characters).', 400));
    }

    // Check duplicate active (pending) enquiry
    const existingPending = await RoomEnquiry.findOne({
      roomId: room._id,
      requesterId: req.user._id,
      status: 'pending',
    });
    if (existingPending) {
      return next(new AppError('You already have an active pending enquiry for this room.', 409));
    }

    const enquiry = await RoomEnquiry.create({
      roomId: room._id,
      requesterId: req.user._id,
      hostId: room.hostId,
      message: message.trim(),
      status: 'pending',
    });

    // Notify room host (never to caller)
    const preview = message.trim().length > 60 ? `${message.trim().slice(0, 57)}...` : message.trim();
    await createNotification({
      userId: room.hostId,
      type: 'ROOM_ENQUIRY',
      title: 'New Room Enquiry',
      message: `${req.user.name} enquired about "${room.title}": "${preview}"`,
      link: '/app/enquiries',
      entityId: room._id.toString(),
    });

    const host = await User.findById(room.hostId, 'name avatarUrl city verificationStatus');

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully.',
      data: toEnquiryDTO(enquiry, room, req.user, host),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/enquiries/mine
 * Authenticated user views enquiries they have created.
 */
export async function getMyEnquiries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const enquiries = await RoomEnquiry.find({ requesterId: req.user._id }).sort({ createdAt: -1 });

    const roomIds = enquiries.map((e) => e.roomId);
    const hostIds = enquiries.map((e) => e.hostId);

    const [rooms, hosts] = await Promise.all([
      Room.find({ _id: { $in: roomIds } }, 'title city locality rent images'),
      User.find({ _id: { $in: hostIds } }, 'name avatarUrl city verificationStatus'),
    ]);

    const roomMap = new Map<string, IRoom>();
    for (const r of rooms) roomMap.set(r._id.toString(), r);

    const hostMap = new Map<string, IUser>();
    for (const h of hosts) hostMap.set(h._id.toString(), h);

    const data = enquiries.map((e) =>
      toEnquiryDTO(e, roomMap.get(e.roomId.toString()), req.user, hostMap.get(e.hostId.toString()))
    );

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
 * GET /api/enquiries/received
 * Room host views enquiries received for their rooms.
 */
export async function getReceivedEnquiries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Always enforce hostId from req.user._id
    const enquiries = await RoomEnquiry.find({ hostId: req.user._id }).sort({ createdAt: -1 });

    const roomIds = enquiries.map((e) => e.roomId);
    const requesterIds = enquiries.map((e) => e.requesterId);

    const [rooms, requesters] = await Promise.all([
      Room.find({ _id: { $in: roomIds } }, 'title city locality rent images'),
      User.find({ _id: { $in: requesterIds } }, 'name avatarUrl city occupation verificationStatus'),
    ]);

    const roomMap = new Map<string, IRoom>();
    for (const r of rooms) roomMap.set(r._id.toString(), r);

    const requesterMap = new Map<string, IUser>();
    for (const u of requesters) requesterMap.set(u._id.toString(), u);

    const data = enquiries.map((e) =>
      toEnquiryDTO(e, roomMap.get(e.roomId.toString()), requesterMap.get(e.requesterId.toString()), req.user)
    );

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
 * PATCH /api/enquiries/:id/respond
 * Room host responds to or closes an enquiry.
 */
export async function respondToEnquiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new AppError('Enquiry not found.', 404));
    }

    const enquiry = await RoomEnquiry.findById(id);
    if (!enquiry) {
      return next(new AppError('Enquiry not found.', 404));
    }

    // Authorization checks
    if (enquiry.requesterId.toString() === req.user._id.toString()) {
      return next(new AppError('Requesters cannot respond to their own enquiry.', 403));
    }

    if (enquiry.hostId.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the room host may respond to this enquiry.', 403));
    }

    const { status, responseMessage } = req.body as {
      status?: 'responded' | 'closed';
      responseMessage?: string;
    };

    if (!status || !['responded', 'closed'].includes(status)) {
      return next(new AppError("Status must be either 'responded' or 'closed'.", 400));
    }

    if (status === 'responded') {
      if (!responseMessage || typeof responseMessage !== 'string' || responseMessage.trim().length < 2) {
        return next(new AppError('A response message of at least 2 characters is required.', 400));
      }
      if (responseMessage.trim().length > 1000) {
        return next(new AppError('Response message is too long (maximum 1000 characters).', 400));
      }
    }

    enquiry.status = status;
    enquiry.responseMessage = responseMessage ? responseMessage.trim() : (status === 'closed' ? 'Enquiry closed by host.' : '');
    enquiry.respondedAt = new Date();
    await enquiry.save();

    const [room, requester] = await Promise.all([
      Room.findById(enquiry.roomId),
      User.findById(enquiry.requesterId),
    ]);

    // Notify requester (never host)
    const roomTitle = room ? room.title : 'room listing';
    const preview = (enquiry.responseMessage || '').length > 60
      ? `${(enquiry.responseMessage || '').slice(0, 57)}...`
      : enquiry.responseMessage || '';

    await createNotification({
      userId: enquiry.requesterId,
      type: 'ROOM_ENQUIRY_RESPONSE',
      title: 'Room Enquiry Response',
      message: `${req.user.name} responded to your enquiry for "${roomTitle}": "${preview}"`,
      link: '/app/enquiries',
      entityId: enquiry.roomId.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Response sent successfully.',
      data: toEnquiryDTO(enquiry, room, requester, req.user),
    });
  } catch (error) {
    next(error);
  }
}
