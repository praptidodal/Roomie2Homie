import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { AppNotification } from '../models/Notification';
import { AppError } from '../middlewares/error.middleware';
import { toNotificationDTO } from '../services/notification.service';

/**
 * GET /api/notifications
 * Returns notifications belonging strictly to the authenticated user, sorted newest first.
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const notifications = await AppNotification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const data = notifications.map(toNotificationDTO);

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
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 */
export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const count = await AppNotification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 * Enforces ownership: only the recipient can mark their notification as read.
 */
export async function markAsRead(
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
      return next(new AppError('Invalid notification ID.', 400));
    }

    const notification = await AppNotification.findById(id);
    if (!notification) {
      return next(new AppError('Notification not found.', 404));
    }

    // Security check: Only the recipient/owner can modify the notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not authorized to update this notification.', 403));
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: toNotificationDTO(notification),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications belonging to the authenticated user as read.
 */
export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    await AppNotification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}
