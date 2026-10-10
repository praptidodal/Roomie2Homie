import { Request, Response, NextFunction } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { User, IUser } from '../models/User';
import { MatchRequest } from '../models/MatchRequest';
import { ChatThread } from '../models/ChatThread';
import { AppError } from '../middlewares/error.middleware';
import { calcCompatibility } from '../utils/compatibility';
import { toCandidateProfileDTO } from '../utils/dto';
import { createNotification } from '../services/notification.service';

/**
 * Helper: Ensures exactly one canonical ChatThread exists for an accepted match pair.
 */
async function ensureChatThread(
  userAId: Types.ObjectId | string,
  userBId: Types.ObjectId | string,
  contextStr = 'Accepted match'
): Promise<void> {
  const aStr = userAId.toString();
  const bStr = userBId.toString();
  if (aStr === bStr) return;

  const low = aStr < bStr ? new Types.ObjectId(aStr) : new Types.ObjectId(bStr);
  const high = aStr < bStr ? new Types.ObjectId(bStr) : new Types.ObjectId(aStr);

  await ChatThread.findOneAndUpdate(
    { participantLow: low, participantHigh: high },
    {
      $setOnInsert: {
        participantLow: low,
        participantHigh: high,
        participants: [low, high],
        context: contextStr,
        lastMessage: 'Match accepted! You can now chat and coordinate flat visits.',
        lastMessageAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

/**
 * GET /api/matches/discover
 * Lists active roommate candidates with dynamically calculated compatibility
 * and relationship status for the authenticated user.
 */
export async function getDiscoverCandidates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUser = req.user;

    const { city, gender, maxBudget, minScore, sleep, cleanliness } = req.query;

    // Build candidate query: exclude current user and paused accounts
    const filter: Record<string, unknown> = {
      _id: { $ne: currentUser._id },
      isPaused: { $ne: true },
    };

    if (city && typeof city === 'string' && city !== 'All cities') {
      filter.city = city;
    }
    if (gender && typeof gender === 'string' && gender !== 'any') {
      filter.gender = gender;
    }
    if (maxBudget) {
      const budgetNum = Number(maxBudget);
      if (!isNaN(budgetNum) && budgetNum > 0) {
        filter.budget = { $lte: budgetNum };
      }
    }
    if (sleep && typeof sleep === 'string' && sleep !== 'any') {
      filter['lifestyle.sleep'] = sleep;
    }
    if (cleanliness && typeof cleanliness === 'string' && cleanliness !== 'any') {
      filter['lifestyle.cleanliness'] = cleanliness;
    }

    const candidates = await User.find(filter).lean();

    // Query existing match requests involving the current user
    const existingRequests = await MatchRequest.find({
      $or: [{ requesterId: currentUser._id }, { recipientId: currentUser._id }],
    }).lean();

    const requestMap = new Map<string, typeof existingRequests[0]>();
    for (const r of existingRequests) {
      const otherId = r.requesterId.toString() === currentUser._id.toString()
        ? r.recipientId.toString()
        : r.requesterId.toString();
      requestMap.set(otherId, r);
    }

    const minScoreNum = Number(minScore) || 0;

    const result = [];
    for (const cand of candidates) {
      const comp = calcCompatibility(currentUser, cand as unknown as IUser);

      if (comp.score < minScoreNum) {
        continue;
      }

      // Determine relationship status
      const existing = requestMap.get(cand._id.toString());
      let status: 'suggested' | 'sent' | 'incoming' | 'accepted' | 'declined' = 'suggested';
      let requestedAt: string | undefined;
      let message: string | undefined;

      if (existing) {
        if (existing.status === 'accepted') {
          status = 'accepted';
        } else if (existing.status === 'declined') {
          status = 'declined';
        } else if (existing.status === 'sent') {
          status = existing.requesterId.toString() === currentUser._id.toString()
            ? 'sent'
            : 'incoming';
        }
        requestedAt = existing.requestedAt ? existing.requestedAt.toISOString() : undefined;
        message = existing.message || undefined;
      }

      result.push({
        id: existing ? existing._id.toString() : undefined,
        profile: toCandidateProfileDTO(cand as unknown as IUser),
        score: comp.score,
        status,
        sharedInterests: comp.sharedInterests,
        factors: comp.factors,
        requestedAt,
        message,
      });
    }

    // Default sort: highest score first
    result.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/matches
 * Returns the current user's MatchRequests categorized for the 4 tabs:
 * incoming, sent, accepted, declined.
 */
export async function getMyMatches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;

    const requests = await MatchRequest.find({
      $or: [{ requesterId: currentUserId }, { recipientId: currentUserId }],
    })
      .sort({ updatedAt: -1 })
      .lean();

    const result = [];
    for (const r of requests) {
      const isRequester = r.requesterId.toString() === currentUserId.toString();
      const otherUserId = isRequester ? r.recipientId : r.requesterId;

      const otherUser = await User.findById(otherUserId).lean();
      if (!otherUser) continue;

      let status: 'incoming' | 'sent' | 'accepted' | 'declined' = 'sent';
      if (r.status === 'accepted') {
        status = 'accepted';
      } else if (r.status === 'declined') {
        status = 'declined';
      } else if (r.status === 'sent') {
        status = isRequester ? 'sent' : 'incoming';
      }

      result.push({
        id: r._id.toString(),
        matchRequestId: r._id.toString(),
        profile: toCandidateProfileDTO(otherUser as unknown as IUser),
        score: r.score,
        status,
        sharedInterests: r.sharedInterests || [],
        factors: r.factors || [],
        requestedAt: r.requestedAt ? r.requestedAt.toISOString() : undefined,
        message: r.message || undefined,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/matches/:profileId
 * Returns detailed compatibility breakdown and profile for a specific candidate.
 */
export async function getMatchDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const { profileId } = req.params;

    if (!isValidObjectId(profileId)) {
      return next(new AppError('Invalid candidate ID.', 400));
    }

    if (profileId === req.user._id.toString()) {
      return next(new AppError('Cannot calculate compatibility with yourself.', 400));
    }

    const candidate = await User.findOne({ _id: profileId, isPaused: { $ne: true } }).lean();
    if (!candidate) {
      return next(new AppError('Member profile not found or is currently paused.', 404));
    }

    const comp = calcCompatibility(req.user, candidate as unknown as IUser);

    // Canonical pair lookup
    const u1 = req.user._id.toString();
    const u2 = candidate._id.toString();
    const userLowId = u1 < u2 ? req.user._id : candidate._id;
    const userHighId = u1 < u2 ? candidate._id : req.user._id;

    const existing = await MatchRequest.findOne({ userLowId, userHighId }).lean();

    let status: 'suggested' | 'sent' | 'incoming' | 'accepted' | 'declined' = 'suggested';
    if (existing) {
      if (existing.status === 'accepted') {
        status = 'accepted';
      } else if (existing.status === 'declined') {
        status = 'declined';
      } else if (existing.status === 'sent') {
        status = existing.requesterId.toString() === u1 ? 'sent' : 'incoming';
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: existing ? existing._id.toString() : undefined,
        profile: toCandidateProfileDTO(candidate as unknown as IUser),
        score: comp.score,
        status,
        sharedInterests: comp.sharedInterests,
        factors: comp.factors,
        requestedAt: existing?.requestedAt ? existing.requestedAt.toISOString() : undefined,
        message: existing?.message || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/matches/request
 * Sends or updates a match request to targetUserId.
 * Enforces canonical pair integrity and handles duplicate, reciprocal, and cooldown rules.
 */
export async function sendMatchRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;

    const { targetUserId: rawTarget, recipientId, message } = req.body as {
      targetUserId?: string;
      recipientId?: string;
      message?: string;
    };
    const targetUserId = rawTarget || recipientId;

    if (!targetUserId || !isValidObjectId(targetUserId)) {
      return next(new AppError('Valid targetUserId is required.', 400));
    }

    // 1. Self-request check
    if (targetUserId === currentUserId.toString()) {
      return next(new AppError('Cannot send a match request to yourself.', 400));
    }

    const targetUser = await User.findOne({ _id: targetUserId, isPaused: { $ne: true } });
    if (!targetUser) {
      return next(new AppError('Target member not found or is currently paused.', 404));
    }

    // Canonical scalar pair fields
    const curStr = currentUserId.toString();
    const tarStr = targetUserId.toString();
    const userLowId = curStr < tarStr ? currentUserId : targetUser._id;
    const userHighId = curStr < tarStr ? targetUser._id : currentUserId;

    const comp = calcCompatibility(req.user, targetUser);

    const existing = await MatchRequest.findOne({ userLowId, userHighId });

    if (existing) {
      // 2. Duplicate same-direction pending request -> idempotent return
      if (existing.status === 'sent' && existing.requesterId.equals(currentUserId)) {
        res.status(200).json({
          success: true,
          message: 'Match request already pending.',
          data: existing,
        });
        return;
      }

      // 3. Reciprocal request: Target has a pending request to Current User -> mutual acceptance!
      if (existing.status === 'sent' && existing.recipientId.equals(currentUserId)) {
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        existing.history = existing.history || [];
        existing.history.push({
          action: 'accepted',
          at: new Date(),
          by: currentUserId,
          reason: 'Mutual reciprocal request',
        });
        await existing.save();

        // Initialize ChatThread
        await ensureChatThread(currentUserId, targetUser._id, 'Accepted match · Mutual request');

        // Notify both users of reciprocal match acceptance
        await createNotification({
          userId: targetUser._id,
          type: 'MATCH_ACCEPTED',
          title: 'Match request accepted',
          message: `${req.user.name} accepted your roommate match request.`,
          link: '/app/chat',
        });
        await createNotification({
          userId: currentUserId,
          type: 'MATCH_ACCEPTED',
          title: 'Match request accepted',
          message: `You and ${targetUser.name} are now matched!`,
          link: '/app/chat',
        });

        res.status(200).json({
          success: true,
          message: 'Reciprocal interest! You are now matched.',
          data: existing,
        });
        return;
      }

      // 4. Already accepted pair
      if (existing.status === 'accepted') {
        return next(new AppError('You are already matched with this member.', 409));
      }

      // 5. Declined request cooldown check
      if (existing.status === 'declined') {
        const now = new Date();
        if (existing.retryAvailableAt && existing.retryAvailableAt > now) {
          return next(
            new AppError(
              `A match request was previously declined. You may retry after ${existing.retryAvailableAt.toISOString()}.`,
              409
            )
          );
        }

        // Cooldown has expired: reuse and update existing document in place
        existing.status = 'sent';
        existing.requesterId = currentUserId;
        existing.recipientId = targetUser._id;
        existing.score = comp.score;
        existing.factors = comp.factors;
        existing.sharedInterests = comp.sharedInterests;
        existing.message = (message || '').trim().slice(0, 300);
        existing.requestedAt = new Date();
        existing.respondedAt = null;
        existing.retryAvailableAt = null;
        existing.history = existing.history || [];
        existing.history.push({
          action: 'retried',
          at: new Date(),
          by: currentUserId,
        });

        await existing.save();

        await createNotification({
          userId: targetUser._id,
          type: 'MATCH_REQUEST_RECEIVED',
          title: 'New match request',
          message: `${req.user.name} sent you a roommate match request.`,
          link: '/app/matches',
        });

        res.status(200).json({
          success: true,
          message: 'Match request resent successfully.',
          data: existing,
        });
        return;
      }
    }

    // 6. Clean new pair
    const newRequest = await MatchRequest.create({
      userLowId,
      userHighId,
      requesterId: currentUserId,
      recipientId: targetUser._id,
      status: 'sent',
      score: comp.score,
      factors: comp.factors,
      sharedInterests: comp.sharedInterests,
      message: (message || '').trim().slice(0, 300),
      requestedAt: new Date(),
    });

    await createNotification({
      userId: targetUser._id,
      type: 'MATCH_REQUEST_RECEIVED',
      title: 'New match request',
      message: `${req.user.name} sent you a roommate match request.`,
      link: '/app/matches',
    });

    res.status(201).json({
      success: true,
      message: 'Match request sent successfully.',
      data: newRequest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/matches/:id/respond
 * Accepts or declines a pending match request.
 * Enforces that only the assigned recipientId can respond.
 */
export async function respondToMatchRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { action, reason } = req.body as {
      action?: 'accept' | 'decline';
      reason?: string;
    };

    if (!action || !['accept', 'decline'].includes(action)) {
      return next(new AppError("Action must be either 'accept' or 'decline'.", 400));
    }

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid request or user ID.', 400));
    }

    // Locate MatchRequest by its _id OR by target userId canonical pair
    let match = await MatchRequest.findById(id);
    if (!match) {
      const u1 = currentUserId.toString();
      const u2 = id;
      const userLowId = u1 < u2 ? currentUserId : new Types.ObjectId(u2);
      const userHighId = u1 < u2 ? new Types.ObjectId(u2) : currentUserId;
      match = await MatchRequest.findOne({ userLowId, userHighId });
    }

    if (!match) {
      return next(new AppError('Match request not found.', 404));
    }

    // Authorization: Only the recipient can accept or decline
    if (!match.recipientId.equals(currentUserId)) {
      return next(
        new AppError('Only the recipient of a match request can respond to it.', 403)
      );
    }

    if (match.status !== 'sent') {
      return next(
        new AppError(`Match request is already ${match.status}.`, 400)
      );
    }

    const now = new Date();
    match.history = match.history || [];

    if (action === 'accept') {
      match.status = 'accepted';
      match.respondedAt = now;
      match.history.push({
        action: 'accepted',
        at: now,
        by: currentUserId,
        reason,
      });

      await match.save();

      // Ensure ChatThread is initialized
      await ensureChatThread(match.requesterId, match.recipientId, 'Accepted match · Roommate connection');

      await createNotification({
        userId: match.requesterId,
        type: 'MATCH_ACCEPTED',
        title: 'Match request accepted',
        message: `${req.user.name} accepted your roommate match request.`,
        link: '/app/chat',
      });

      res.status(200).json({
        success: true,
        message: 'Match request accepted.',
        data: match,
      });
      return;
    }

    if (action === 'decline') {
      match.status = 'declined';
      match.respondedAt = now;
      // 30-day cooldown
      match.retryAvailableAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      match.history.push({
        action: 'declined',
        at: now,
        by: currentUserId,
        reason,
      });

      await match.save();

      await createNotification({
        userId: match.requesterId,
        type: 'MATCH_DECLINED',
        title: 'Match request declined',
        message: `${req.user.name} declined your roommate match request.`,
        link: '/app/matches',
      });

      res.status(200).json({
        success: true,
        message: 'Match request declined.',
        data: match,
      });
      return;
    }
  } catch (error) {
    next(error);
  }
}
