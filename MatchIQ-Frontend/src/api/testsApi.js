// ── Tests API ───────────────────────────────────────────────────
// Gorilla Test endpoints for offers and candidates.

import { apiFetch } from './apiClient.js';

/**
 * Get Gorilla Test for a candidate (questions WITHOUT correct answers).
 * @param {string} offerId
 * @returns {Promise<{ success: boolean, test: object }>}
 */
export async function getGorillaTest(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/gorilla-test`);
    return res.test;
}

/**
 * Get FULL Gorilla Test (questions WITH correct answers) — company preview.
 * @param {string} offerId
 * @returns {Promise<object>}
 */
export async function getFullGorillaTest(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/gorilla-test/full`);
    return res.test;
}

/**
 * Get test metadata (id, offer_id, time_limit_minutes) for an offer.
 * @param {string} offerId
 * @returns {Promise<object>}
 */
export async function getTestInfo(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/test-info`);
    return res.test;
}

/**
 * Submit candidate answers for a Gorilla Test.
 * @param {string} testId
 * @param {string} candidateId
 * @param {object} answers - e.g. { "1": "A", "2": "C" }
 * @returns {Promise<object>}
 */
export async function submitGorillaTest(testId, candidateId, answers) {
    return apiFetch(`/tests/gorilla-tests/${testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId, answers }),
    });
}

/**
 * Get all submissions for a test, ranked by score.
 * @param {string} testId
 * @returns {Promise<Array>}
 */
export async function getTestSubmissions(testId) {
    const res = await apiFetch(`/tests/gorilla-tests/${testId}/submissions`);
    return res.submissions;
}

/**
 * Get detailed result for one candidate in a test.
 * @param {string} testId
 * @param {string} candidateId
 * @returns {Promise<object>}
 */
export async function getCandidateSubmission(testId, candidateId) {
    const res = await apiFetch(`/tests/gorilla-tests/${testId}/submissions/${candidateId}`);
    return res.submission;
}

// ── Test invitations (persisted in DB via backend) ───────────

/**
 * Invite a candidate to take a test for an offer (Company action).
 * POST /tests/job-offers/:offerId/invite
 * @param {string} offerId
 * @param {string} candidateId
 * @returns {Promise<object>}
 */
export async function inviteCandidate(offerId, candidateId) {
    return apiFetch(`/tests/job-offers/${offerId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId }),
    });
}

/**
 * Get all test invitations for the logged-in candidate.
 * GET /tests/my-invitations
 * @returns {Promise<Array>}
 */
export async function getMyInvitations() {
    const res = await apiFetch('/tests/my-invitations');
    return res.invitations || res.data || res || [];
}
