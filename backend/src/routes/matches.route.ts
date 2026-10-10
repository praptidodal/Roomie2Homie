import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getDiscoverCandidates,
  getMyMatches,
  getMatchDetail,
  sendMatchRequest,
  respondToMatchRequest,
} from '../controllers/matches.controller';

const matchesRouter = Router();

// Protect all match routes with authentication
matchesRouter.use(authenticate);

/**
 * GET /api/matches/discover
 * Discover roommate candidates in search city with dynamic compatibility scoring.
 */
matchesRouter.get('/discover', getDiscoverCandidates);

/**
 * GET /api/matches
 * Retrieve current user's MatchRequests across incoming, sent, accepted, declined.
 */
matchesRouter.get('/', getMyMatches);

/**
 * POST /api/matches/request (and /api/matches/requests)
 * Send or update a match request.
 */
matchesRouter.post('/request', sendMatchRequest);
matchesRouter.post('/requests', sendMatchRequest);

/**
 * PATCH /api/matches/:id/respond (and /api/matches/requests/:id)
 * Accept or decline a match request (recipient only).
 */
matchesRouter.patch('/:id/respond', respondToMatchRequest);
matchesRouter.patch('/requests/:id', respondToMatchRequest);

/**
 * GET /api/matches/:profileId
 * Fetch full compatibility breakdown and profile for "Why you matched" view.
 * NOTE: Placed after /discover to prevent parameter collision.
 */
matchesRouter.get('/:profileId', getMatchDetail);

export default matchesRouter;
