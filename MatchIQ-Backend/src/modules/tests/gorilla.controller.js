import {
  getGorillaTestForCandidateService,
  getFullGorillaTestService,
  getTestByOfferIdService,
} from "./gorilla.test.service.js";

import {
  submitGorillaTestService,
  getTestSubmissionsService,
  getCandidateSubmissionService,
} from "./gorilla.submission.service.js";

import {
  inviteCandidateService,
  inviteMultipleCandidatesService,
  getCandidateInvitationsService,
  completeInvitationService,
} from "./gorilla.invitation.service.js";

// ─────────────────────────────────────────────────────────────
// GET /tests/job-offers/:offerId/gorilla-test
// Returns test WITHOUT correct answers — for candidates
// ─────────────────────────────────────────────────────────────
export async function getGorillaTestController(req, res) {
  try {
    const test = await getGorillaTestForCandidateService(req.params.offerId);
    return res.status(200).json({ success: true, test });
  } catch (error) {
    console.error("[GorillaTest] getGorillaTestController:", error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /tests/job-offers/:offerId/gorilla-test/full
// Returns test WITH correct answers — admin only
// ─────────────────────────────────────────────────────────────
export async function getFullGorillaTestController(req, res) {
  try {
    const test = await getFullGorillaTestService(req.params.offerId);
    return res.status(200).json({ success: true, test });
  } catch (error) {
    console.error("[GorillaTest] getFullGorillaTestController:", error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /tests/job-offers/:offerId/test-info
// Returns test id + metadata for a given offer — used by n8n
// ─────────────────────────────────────────────────────────────
export async function getTestByOfferIdController(req, res) {
  try {
    const test = await getTestByOfferIdService(req.params.offerId);
    return res.status(200).json({ success: true, test });
  } catch (error) {
    console.error("[GorillaTest] getTestByOfferIdController:", error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /tests/gorilla-tests/:testId/submit
// Candidate submits answers — evaluated immediately
// Body: { candidate_id, answers: { "1": "A", "2": "C", ... } }
// ─────────────────────────────────────────────────────────────
export async function submitGorillaTestController(req, res) {
  try {
    const { testId } = req.params;
    const { candidate_id, answers } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ success: false, message: "candidate_id is required" });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers must be an object e.g. { "1": "A", "2": "C", ... }',
      });
    }

    const result = await submitGorillaTestService(testId, candidate_id, answers);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("[GorillaTest] submitGorillaTestController:", error.message);
    const isConflict = error.message.includes("already submitted");
    return res.status(isConflict ? 409 : 500).json({
      success: false,
      message: error.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /tests/gorilla-tests/:testId/submissions
// All submissions ranked by score DESC
// ─────────────────────────────────────────────────────────────
export async function getTestSubmissionsController(req, res) {
  try {
    const submissions = await getTestSubmissionsService(req.params.testId);
    return res.status(200).json({ success: true, total: submissions.length, submissions });
  } catch (error) {
    console.error("[GorillaTest] getTestSubmissionsController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /tests/gorilla-tests/:testId/submissions/:candidateId
// Detailed result for one candidate
// ─────────────────────────────────────────────────────────────
export async function getCandidateSubmissionController(req, res) {
  try {
    const { testId, candidateId } = req.params;
    const submission = await getCandidateSubmissionService(testId, candidateId);
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    console.error("[GorillaTest] getCandidateSubmissionController:", error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------
// POST /tests/job-offers/:offerId/invite
// Company invites a candidate (or multiple) to take the test
// Body: { candidate_id: "..." } or { candidate_ids: [...] }
// -----------------------------------------------------------------
export async function inviteCandidateController(req, res) {
  try {
    const { offerId } = req.params;
    const { candidate_id, candidate_ids } = req.body;

    if (candidate_ids && Array.isArray(candidate_ids)) {
      const results = await inviteMultipleCandidatesService(offerId, candidate_ids);
      return res.status(200).json({ success: true, results });
    }

    if (!candidate_id) {
      return res.status(400).json({ success: false, message: "candidate_id or candidate_ids is required" });
    }

    const result = await inviteCandidateService(offerId, candidate_id);
    return res.status(result.alreadyExists ? 200 : 201).json({ success: true, ...result });
  } catch (error) {
    console.error("[GorillaTest] inviteCandidateController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------
// GET /tests/my-invitations
// Candidate sees their pending/completed test invitations
// Requires authentication as candidate
// -----------------------------------------------------------------
export async function getCandidateInvitationsController(req, res) {
  try {
    const userId = req.user.id;

    // Get the candidate_profile id from user id
    const profileResult = await (await import("../../config/db.js")).default.query(
      `SELECT id FROM candidate_profiles WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate profile not found" });
    }

    const candidateProfileId = profileResult.rows[0].id;
    const invitations = await getCandidateInvitationsService(candidateProfileId);

    return res.status(200).json({ success: true, total: invitations.length, invitations });
  } catch (error) {
    console.error("[GorillaTest] getCandidateInvitationsController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}