import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getMyEnquiries,
  getReceivedEnquiries,
  respondToEnquiry,
} from '../controllers/enquiries.controller';

const enquiriesRouter = Router();

/**
 * GET /api/enquiries/mine
 * List enquiries sent by current authenticated user.
 */
enquiriesRouter.get('/mine', authenticate, getMyEnquiries);

/**
 * GET /api/enquiries/received
 * List enquiries received by current authenticated host for their rooms.
 */
enquiriesRouter.get('/received', authenticate, getReceivedEnquiries);

/**
 * PATCH /api/enquiries/:id/respond
 * Host responds to or closes an enquiry.
 */
enquiriesRouter.patch('/:id/respond', authenticate, respondToEnquiry);

export default enquiriesRouter;
