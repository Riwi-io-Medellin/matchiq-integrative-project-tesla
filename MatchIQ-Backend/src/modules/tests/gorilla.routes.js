import { Router } from "express";
import {
  getGorillaTestController,
  getFullGorillaTestController,
  getTestByOfferIdController,
  submitGorillaTestController,
  getTestSubmissionsController,
  getCandidateSubmissionController,
  inviteCandidateController,
  getCandidateInvitationsController,
} from "./gorilla.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

// -- By offer ---------------------------------------------------------------

// GET /tests/job-offers/:offerId/gorilla-test
// Returns questions WITHOUT correct answers -- for candidates
router.get("/job-offers/:offerId/gorilla-test", getGorillaTestController);

// GET /tests/job-offers/:offerId/gorilla-test/full
// Returns questions WITH correct answers -- admin only
router.get("/job-offers/:offerId/gorilla-test/full", getFullGorillaTestController);

// GET /tests/job-offers/:offerId/test-info
// Returns test id + metadata -- used by n8n to get the test reference for the email
router.get("/job-offers/:offerId/test-info", getTestByOfferIdController);

// POST /tests/job-offers/:offerId/invite
// Company invites candidate(s) to take the test
router.post("/job-offers/:offerId/invite", authenticate, authorize("company"), inviteCandidateController);

// -- By test ----------------------------------------------------------------

// POST /tests/gorilla-tests/:testId/submit
// Candidate submits answers
router.post("/gorilla-tests/:testId/submit", submitGorillaTestController);

// GET /tests/gorilla-tests/:testId/submissions
// Ranking of all candidates who submitted
router.get("/gorilla-tests/:testId/submissions", getTestSubmissionsController);

// GET /tests/gorilla-tests/:testId/submissions/:candidateId
// Detailed result for one candidate
router.get("/gorilla-tests/:testId/submissions/:candidateId", getCandidateSubmissionController);

// -- Candidate invitations ---------------------------------------------------

// GET /tests/my-invitations
// Candidate sees their pending/completed test invitations
router.get("/my-invitations", authenticate, authorize("candidate"), getCandidateInvitationsController);

export default router;