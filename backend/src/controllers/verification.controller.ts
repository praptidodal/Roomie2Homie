import { Request, Response, NextFunction } from 'express';
import { VerificationRequest } from '../models/VerificationRequest';
import { AppError } from '../middlewares/error.middleware';
import {
  maskIdNumber,
  encryptIdNumber,
  normalizeDocType,
  toVerificationDTO,
} from '../services/verification.service';

/**
 * POST /api/verification/request
 * Authenticated user submits a verification request.
 * Raw ID numbers are never persisted; identifiers are masked before storage.
 */
export async function submitVerificationRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { type, docType, institution, idNumber } = req.body as {
      type?: string;
      docType?: string;
      institution?: string;
      idNumber?: string;
    };

    // 1. Validation
    if (!institution || typeof institution !== 'string' || institution.trim().length < 2) {
      return next(new AppError('College/Institution name is required.', 400));
    }
    if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length < 4) {
      return next(new AppError('A valid ID number of at least 4 characters is required.', 400));
    }
    if (idNumber.trim().length > 60) {
      return next(new AppError('ID number is too long.', 400));
    }

    // 2. Check if already verified
    if (req.user.verificationStatus === 'verified' || (req.user as any).isVerified) {
      return next(new AppError('Your profile is already verified.', 409));
    }

    // 3. Duplicate check: prevent duplicate pending requests
    const pending = await VerificationRequest.findOne({
      userId: req.user._id,
      status: 'pending',
    });
    if (pending) {
      return next(
        new AppError('You already have a pending verification request under review.', 409)
      );
    }

    // 4. Transform, mask, and securely encrypt sensitive ID
    const masked = maskIdNumber(idNumber);
    const encrypted = encryptIdNumber(idNumber);
    const normalizedDoc = normalizeDocType(type || docType);
    const institutionStr = (institution || '').trim().slice(0, 100);
    const safeDocumentUrl = institutionStr
      ? `institution:${institutionStr}`
      : 'institution:College / University';

    // 5. Persist strictly masked and encrypted verification record (raw plaintext is NEVER persisted)
    const requestDoc = await VerificationRequest.create({
      userId: req.user._id,
      docType: normalizedDoc,
      idNumber: masked,
      encryptedId: encrypted,
      documentUrl: safeDocumentUrl,
      status: 'pending',
    });

    // 6. Update user's verification status
    req.user.verificationStatus = 'pending';
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully.',
      data: toVerificationDTO(requestDoc),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/verification/me
 * Returns current user's latest verification status.
 */
export async function getMyVerificationStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const latest = await VerificationRequest.findOne({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    if (!latest) {
      res.status(200).json({
        success: true,
        data: {
          status: 'not_submitted',
          verificationStatus: req.user.verificationStatus || 'unverified',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toVerificationDTO(latest),
    });
  } catch (error) {
    next(error);
  }
}
