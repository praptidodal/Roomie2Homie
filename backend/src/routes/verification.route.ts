import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  submitVerificationRequest,
  getMyVerificationStatus,
} from '../controllers/verification.controller';

const verificationRouter = Router();

verificationRouter.use(authenticate);

// POST /api/verification/request
verificationRouter.post('/request', submitVerificationRequest);

// GET /api/verification/me
verificationRouter.get('/me', getMyVerificationStatus);

export default verificationRouter;
