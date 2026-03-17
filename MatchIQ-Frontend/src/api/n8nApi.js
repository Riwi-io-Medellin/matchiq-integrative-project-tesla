// ── Candidate Notification API ──────────────────────────────────
// Calls the backend endpoint that triggers n8n + Gmail email flows.

import { apiFetch } from "./apiClient.js";

/**
 * Notify a candidate about their status in a job offer process.
 * The backend sends the data to n8n which triggers Gmail automatically.
 *
 * @param {string} offerId     – Job offer UUID
 * @param {string} candidateId – Candidate UUID
 * @param {"technical_test"|"approved"|"rejected"} status
 * @returns {Promise<{success: boolean, message: string, notified: boolean, candidate_email: string}>}
 */
export async function notifyCandidate(offerId, candidateId, status) {
  return apiFetch(`/matching/job-offers/${offerId}/candidates/${candidateId}/notify`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
