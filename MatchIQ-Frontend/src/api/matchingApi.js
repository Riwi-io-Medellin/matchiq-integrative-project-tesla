// ── Matching API ────────────────────────────────────────────────
// Candidate matching for job offers.

import { apiFetch } from './apiClient.js';

/**
 * Run matching for a specific offer.
 * @param {string} offerId
 * @param {number} [aiTop=3] - Number of top candidates to evaluate with AI
 * @returns {Promise<{ ranking: Array, ai_evaluation_candidates: Array, total_candidates: number }>}
 */
export async function getMatchesForOffer(offerId, aiTop = 3) {
    return apiFetch(`/matching/job-offers/${offerId}/matches?aiTop=${aiTop}`);
}
