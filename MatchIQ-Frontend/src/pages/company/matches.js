// ── Matches View Logic ──────────────────────────────────────────
// Shows candidate matches ranked by compatibility for a specific offer.

import { getMatchesForOffer } from '../../api/matchingApi.js';
import { getOfferById } from '../../api/offersApi.js';
import { getTestInfo, getTestSubmissions, inviteCandidate } from '../../api/testsApi.js';
import { getCompanyProfile } from '../../api/companyApi.js';
import { showToast, showConfirmModal } from './app.js';
import { notifyCandidate } from '../../api/n8nApi.js';

/* ── SVG Icons ─────────────────────────────────────────────────── */
const ICON = {
    experience: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    english: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>`,
    seniority: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>`,
    person: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="opacity:0.4"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>`,
    test: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    discard: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

const ICON_LG = {
    experience: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    english: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26z"/></svg>`,
    seniority: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>`,
};

const REC_COLORS = {
    strong: { bg: 'rgba(22, 163, 74, 0.12)', border: 'rgba(22, 163, 74, 0.35)', text: '#15803d', label: 'Strong' },
    moderate: { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.40)', text: '#a16207', label: 'Moderate' },
    weak: { bg: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.30)', text: '#b91c1c', label: 'Weak' },
};

/** Build display name from whichever fields the backend provides */
function getCandidateName(candidate) {
    if (candidate.first_name || candidate.last_name) {
        return [candidate.first_name, candidate.last_name].filter(Boolean).join(' ');
    }
    return candidate.candidate_name || candidate.email || `Candidate ${String(candidate.candidate_id || '').slice(0, 8)}`;
}

/** Store candidates for modal access */
let candidatesMap = new Map();
let aiMapGlobal = new Map();
let currentOfferId = null;
let currentOfferTitle = '';
let cachedTestInfo = null;
let submissionsMap = new Map(); // candidateId → { status, score, feedback, ... }
let companyName = '';

/* ── Candidate Status Persistence (localStorage) ──────────────── */
function getCandidateStatusKey(offerId) {
    return `matchiq_candidate_status_${offerId}`;
}

function loadCandidateStatuses(offerId) {
    try {
        const raw = localStorage.getItem(getCandidateStatusKey(offerId));
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveCandidateStatus(offerId, candidateId, status) {
    const statuses = loadCandidateStatuses(offerId);
    statuses[String(candidateId)] = status;
    localStorage.setItem(getCandidateStatusKey(offerId), JSON.stringify(statuses));
}

/**
 * Initializes the matches view.
 * @param {{ id: string }} params - Must contain offer ID
 */
export async function initMatches(params = {}) {
    const container = document.getElementById('matches-container');
    const kpisEl = document.getElementById('matches-kpis');
    const titleEl = document.getElementById('matches-title');
    const subtitleEl = document.getElementById('matches-subtitle');

    candidatesMap.clear();
    aiMapGlobal.clear();
    submissionsMap.clear();
    cachedTestInfo = null;
    currentOfferId = params.id || null;

    if (!params.id) {
        container.innerHTML = emptyState('No offer selected', 'Go back to offers and click "Find Matches" on an offer.');
        return;
    }

    // Show loader
    container.innerHTML = `
        <div class="page-loader" style="grid-column: 1 / -1;">
            <div class="page-loader__spinner"></div>
            <span class="page-loader__text">Running matching…</span>
        </div>`;

    try {
        // Fetch offer details + matching + test info + company profile in parallel
        const [offer, matchResult, testInfo, companyProfile] = await Promise.all([
            getOfferById(params.id),
            getMatchesForOffer(params.id),
            getTestInfo(params.id).catch(() => null),
            getCompanyProfile().catch(() => null),
        ]);

        cachedTestInfo = testInfo;
        currentOfferTitle = offer?.title || '';
        companyName = companyProfile?.company_name || '';

        // Fetch existing submissions to know status per candidate
        if (testInfo?.id) {
            try {
                const submissions = await getTestSubmissions(testInfo.id);
                if (Array.isArray(submissions)) {
                    submissions.forEach(s => {
                        if (s.candidate_id) {
                            // Backend returns "evaluated" or "completed" for finished tests
                            const isDone = s.status === 'evaluated' || s.status === 'completed';
                            submissionsMap.set(String(s.candidate_id), {
                                status: isDone ? 'completed' : (s.status || 'pending'),
                                score: s.percentage_score ?? s.score,
                                feedback: s.feedback,
                                submitted_at: s.submitted_at,
                                ai_evaluated_at: s.ai_evaluated_at,
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn('Could not fetch existing submissions:', e);
            }
        }

        // Update header
        if (offer) {
            titleEl.textContent = `Matches for "${esc(offer.title)}"`;
            subtitleEl.textContent = `Candidates ranked by compatibility with this offer.`;
        }

        const { ranking = [], ai_evaluation_candidates: aiCandidates = [], total_candidates = 0 } = matchResult;

        // KPIs
        document.getElementById('match-kpi-total').textContent = total_candidates;
        document.getElementById('match-kpi-best').textContent = ranking.length > 0
            ? `${Math.round(ranking[0].final_match_percentage)}%`
            : '—';
        document.getElementById('match-kpi-ai').textContent = aiCandidates.length;
        kpisEl.style.display = '';

        // Empty state
        if (ranking.length === 0) {
            container.innerHTML = emptyState(
                'No matching candidates',
                'There are no candidates that match the requirements of this offer yet.'
            );
            return;
        }

        // Build AI lookup map
        aiCandidates.forEach(c => {
            if (c.ai_feedback) {
                aiMapGlobal.set(String(c.candidate_id), c.ai_feedback);
            }
        });

        // Store all candidates for modal
        ranking.forEach((c, i) => {
            candidatesMap.set(String(c.candidate_id), { ...c, rank: i + 1 });
        });

        // Render candidate cards
        container.innerHTML = ranking.map((c, i) => renderCandidateCard(c, i, aiMapGlobal)).join('');

        // Event delegation for card clicks
        container.addEventListener('click', (e) => {
            // Send Test button click
            const sendTestBtn = e.target.closest('.match-card__send-test');
            if (sendTestBtn) {
                e.stopPropagation();
                const candidateId = sendTestBtn.dataset.candidateId;
                if (candidateId) handleSendTest(candidateId);
                return;
            }

            // View Results button click
            const viewResultsBtn = e.target.closest('.match-card__view-results');
            if (viewResultsBtn) {
                e.stopPropagation();
                const candidateId = viewResultsBtn.dataset.candidateId;
                if (candidateId) openCandidateModal(candidateId);
                return;
            }

            // Pass to Next Filter button click
            const passFilterBtn = e.target.closest('.match-card__pass-filter');
            if (passFilterBtn) {
                e.stopPropagation();
                const candidateId = passFilterBtn.dataset.candidateId;
                if (candidateId) handlePassToNextFilter(candidateId);
                return;
            }

            // Discard Candidate button click
            const discardBtn = e.target.closest('.match-card__discard');
            if (discardBtn) {
                e.stopPropagation();
                const candidateId = discardBtn.dataset.candidateId;
                if (candidateId) handleDiscardCandidate(candidateId);
                return;
            }

            // AI toggle
            const toggle = e.target.closest('.match-card__ai-toggle');
            if (toggle) {
                e.stopPropagation();
                const detail = toggle.closest('.match-card').querySelector('.match-card__ai-detail');
                if (detail) {
                    detail.classList.toggle('is-open');
                    toggle.textContent = detail.classList.contains('is-open') ? 'Hide AI insight ▲' : 'View AI insight ▼';
                }
                return;
            }

            // Card click → open profile modal
            const card = e.target.closest('.match-card');
            if (card) {
                const candidateId = card.dataset.candidateId;
                if (candidateId) openCandidateModal(candidateId);
            }
        });


    } catch (err) {
        console.error('Matching error:', err);
        container.innerHTML = emptyState(
            'Error running matching',
            err.message || 'Something went wrong. Please try again.'
        );
    }
}

/* ── Send Test Logic ────────────────────────────────────────────── */

async function handleSendTest(candidateId) {
    const candidate = candidatesMap.get(candidateId);
    if (!candidate) return;

    const name = getCandidateName(candidate);

    if (!cachedTestInfo) {
        showToast('No test available for this offer. Tests are generated automatically when an offer is created.', 'error');
        return;
    }

    // Simple confirmation before sending
    const confirmed = await showConfirmModal(
        'Send Test',
        `Are you sure you want to send the test to ${name}?`
    );

    if (!confirmed) return;

    try {
        await inviteCandidate(currentOfferId, candidateId);
        submissionsMap.set(String(candidateId), { status: 'pending', score: null, feedback: null });
        showToast(`Test sent to ${name}`, 'success');

        // Notify candidate via backend (n8n → Gmail)
        notifyCandidate(currentOfferId, candidateId, 'technical_test').catch(err =>
            console.warn('Notification failed:', err.message)
        );

        // Update the card footer visually
        const footer = document.querySelector(`.match-card[data-candidate-id="${candidateId}"] .match-card__footer`);
        if (footer) {
            const testArea = footer.querySelector('.match-card__send-test');
            if (testArea) {
                testArea.outerHTML = `<span class="match-card__test-status match-card__test-status--pending">${ICON.clock} Pending</span>`;
            }
        }

        // Update modal button if open
        const modalBtn = document.getElementById('modal-send-test-btn');
        if (modalBtn && modalBtn.dataset.candidateId === candidateId) {
            modalBtn.classList.add('btn--ghost');
            modalBtn.classList.remove('btn--primary');
            modalBtn.innerHTML = `${ICON.clock} Test Pending`;
            modalBtn.disabled = true;
        }
    } catch (err) {
        console.error('Error inviting candidate:', err);
        showToast(`Error: ${err.message || 'Could not send the test'}`, 'error');
    }
}

/* ── Pass to Next Filter ───────────────────────────────────────── */

async function handlePassToNextFilter(candidateId) {
    const candidate = candidatesMap.get(candidateId);
    if (!candidate) return;

    const name = getCandidateName(candidate);
    const submission = submissionsMap.get(String(candidateId));
    const score = submission?.score != null ? Math.round(submission.score) : '—';

    const confirmed = await showConfirmModal(
        'Pass to Next Filter',
        `Pass ${name} (Score: ${score}%) to the next stage? An email will be sent to notify them.`
    );

    if (!confirmed) return;

    // Notify candidate via backend (n8n → Gmail)
    try {
        await notifyCandidate(currentOfferId, candidateId, 'approved');
    } catch (err) {
        console.warn('Notification failed:', err.message);
    }

    showToast(`${name} has been passed to the next filter. Notification sent!`, 'success');

    // Persist status
    saveCandidateStatus(currentOfferId, candidateId, 'passed');

    // Update the button visually
    const btn = document.querySelector(`.match-card__pass-filter[data-candidate-id="${candidateId}"]`);
    if (btn) {
        btn.outerHTML = `<span class="match-card__test-status match-card__test-status--passed">${ICON.check} Passed</span>`;
    }

    // Remove the discard button from the card
    const discardBtn = document.querySelector(`.match-card__discard[data-candidate-id="${candidateId}"]`);
    if (discardBtn) {
        discardBtn.remove();
    }

    // Update modal if open
    const modalPassBtn = document.getElementById('modal-pass-filter-btn');
    if (modalPassBtn && modalPassBtn.dataset.candidateId === candidateId) {
        modalPassBtn.classList.remove('btn--primary');
        modalPassBtn.classList.add('btn--ghost');
        modalPassBtn.innerHTML = `${ICON.check} Passed to Next Filter`;
        modalPassBtn.disabled = true;
    }
}

/* ── Discard Candidate ─────────────────────────────────────────── */

async function handleDiscardCandidate(candidateId) {
    const candidate = candidatesMap.get(candidateId);
    if (!candidate) return;

    const name = getCandidateName(candidate);

    const confirmed = await showConfirmModal(
        'Discard Candidate',
        `Are you sure you want to discard ${name}? An email will be sent to notify them that they were not selected.`
    );

    if (!confirmed) return;

    try {
        await notifyCandidate(currentOfferId, candidateId, 'rejected');
    } catch (err) {
        console.warn('Notification failed:', err.message);
    }

    showToast(`${name} has been discarded. Notification sent.`, 'success');

    // Persist status
    saveCandidateStatus(currentOfferId, candidateId, 'discarded');

    // Update the card actions visually
    const actionsEl = document.querySelector(`.match-card[data-candidate-id="${candidateId}"] .match-card__actions`);
    if (actionsEl) {
        actionsEl.innerHTML = `<span class="match-card__test-status match-card__test-status--discarded">${ICON.discard} Discarded</span>`;
    }

    // Update modal if open
    const modalDiscardBtn = document.getElementById('modal-discard-btn');
    if (modalDiscardBtn && modalDiscardBtn.dataset.candidateId === candidateId) {
        modalDiscardBtn.classList.remove('btn--danger');
        modalDiscardBtn.classList.add('btn--ghost');
        modalDiscardBtn.innerHTML = `${ICON.discard} Discarded`;
        modalDiscardBtn.disabled = true;
    }
}

/* ── Modal ──────────────────────────────────────────────────────── */

function openCandidateModal(candidateId) {
    const modal = document.getElementById('candidateModal');
    const contentEl = document.getElementById('candidateModalContent');
    const candidate = candidatesMap.get(candidateId);
    if (!modal || !contentEl || !candidate) return;

    const ai = aiMapGlobal.get(candidateId);
    const pct = Math.round(candidate.final_match_percentage || 0);
    const name = getCandidateName(candidate);
    const email = candidate.email || '';
    const github_link = candidate.github_link || '';

    const skills = candidate.matched_skills
        ? (typeof candidate.matched_skills === 'string' ? candidate.matched_skills.split(',') : candidate.matched_skills)
        : [];

    // Email row
    const emailHtml = email ? `
        <div class="candidate-modal__email-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            <span class="candidate-modal__email-text">${esc(email)}</span>
            <button type="button" class="candidate-modal__copy-btn" id="copy-email-btn" title="Copy email">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
        </div>` : '';

    // GitHub row
    const githubHtml = github_link ? `
        <div class="candidate-modal__email-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>

        </div>` : '';

    // Skills html
    const skillsHtml = skills.length > 0 ? `
        <div class="candidate-modal__section">
            <h4>Matched Skills</h4>
            <div class="match-card__skills">
                ${skills.map(s => `<span class="match-card__skill">${esc(typeof s === 'string' ? s.trim() : s.name || s)}</span>`).join('')}
            </div>
        <a href="${esc(github_link)}" target="_blank" rel="noopener noreferrer" class="candidate-modal__email-text" style="color: var(--accent); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(github_link)}</a>
            <button type="button" class="candidate-modal__copy-btn" id="copy-github-btn" title="Copy GitHub URL">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
        </div>` : '';

    // AI html
    let aiHtml = '';
    if (ai) {
        const rec = REC_COLORS[ai.recommendation] || REC_COLORS.moderate;
        aiHtml = `
        <div class="candidate-modal__section">
            <h4>AI Evaluation</h4>
            <div class="match-card__ai-badge" style="background:${rec.bg}; border-color:${rec.border}; color:${rec.text}; margin-bottom: 12px;">
                ${rec.label} match${ai.fit_score != null ? ` · ${ai.fit_score}/100` : ''}
            </div>
            <p class="ai-insight">${esc(ai.insight || '')}</p>
            ${ai.strengths?.length ? `
            <div class="ai-list ai-list--strengths">
                <strong>Strengths</strong>
                <ul>${ai.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
            </div>` : ''}
            ${ai.risks?.length ? `
            <div class="ai-list ai-list--risks">
                <strong>Risks</strong>
                <ul>${ai.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
            </div>` : ''}
        </div>`;
    }

    // Test section html
    let testHtml = '';
    if (cachedTestInfo) {
        const sub = submissionsMap.get(String(candidateId));
        const savedStatuses = loadCandidateStatuses(currentOfferId);
        const savedStatus = savedStatuses[String(candidateId)];

        if (sub && sub.status === 'completed') {
            const score = sub.score != null ? Math.round(sub.score) : '—';

            let actionButtonsHtml = '';
            if (savedStatus === 'passed') {
                actionButtonsHtml = `
                <div style="display: flex; gap: 10px; margin-top: 12px;">
                    <button class="btn btn--ghost" style="flex: 1;" disabled>
                        ${ICON.check} Passed to Next Filter
                    </button>
                </div>`;
            } else if (savedStatus === 'discarded') {
                actionButtonsHtml = `
                <div style="display: flex; gap: 10px; margin-top: 12px;">
                    <button class="btn btn--ghost" style="flex: 1;" disabled>
                        ${ICON.discard} Discarded
                    </button>
                </div>`;
            } else {
                actionButtonsHtml = `
                <div style="display: flex; gap: 10px; margin-top: 12px;">
                    <button class="btn btn--primary" style="flex: 1;" id="modal-pass-filter-btn" data-candidate-id="${candidateId}">
                        Pass to Next Filter ${ICON.arrow}
                    </button>
                    <button class="btn btn--danger" style="flex: 1;" id="modal-discard-btn" data-candidate-id="${candidateId}">
                        ${ICON.discard} Discard
                    </button>
                </div>`;
            }

            testHtml = `
            <div class="candidate-modal__section candidate-modal__test-action">
                <h4>${ICON.test} Test Results</h4>
                <div class="modal-results-card">
                    <div class="modal-results-card__stat">
                        <span class="modal-results-card__label">Score</span>
                        <strong class="modal-results-card__value">${score}%</strong>
                    </div>
                    ${sub.feedback ? `
                    <div class="modal-results-card__feedback">
                        <span class="modal-results-card__label">Feedback</span>
                        <p>${esc(sub.feedback)}</p>
                    </div>` : ''}
                </div>
                ${actionButtonsHtml}
            </div>`;
        } else if (sub) {
            testHtml = `
            <div class="candidate-modal__section candidate-modal__test-action">
                <h4>${ICON.test} Test</h4>
                <div class="modal-results-card modal-results-card--pending">
                    <span>${ICON.clock} Test has been sent. Waiting for the candidate to complete it.</span>
                </div>
                <button class="btn btn--ghost btn--full" disabled>
                    ${ICON.clock} Test Pending
                </button>
            </div>`;
        } else {
            testHtml = `
            <div class="candidate-modal__section candidate-modal__test-action">
                <h4><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>Test</h4>
                <p class="muted" style="margin-bottom: 12px;">Send a technical assessment to evaluate this candidate's skills.</p>
                <button class="btn btn--primary btn--full" id="modal-send-test-btn" data-candidate-id="${candidateId}">
                    Send Test
                </button>
            </div>`;
        }
    }

    // Build full content
    contentEl.innerHTML = `
        <div class="candidate-modal__head">
            <div>
                <h3>${esc(name)}</h3>
                ${emailHtml}
                ${githubHtml}
            </div>
            <button class="modal-close-btn" id="closeCandidateModal" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
        </div>

        <div class="candidate-modal__score-section">
            <div class="candidate-modal__score-card">
                <div class="match-card__score match-card__score--lg" style="--pct: ${pct}">
                    <svg class="match-card__gauge" viewBox="0 0 36 36">
                        <path class="match-card__gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path class="match-card__gauge-fill" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    </svg>
                    <span class="match-card__pct match-card__pct--lg">${pct}%</span>
                </div>
                <div>
                    <strong class="candidate-modal__score-label">Match Score</strong>
                    <span class="candidate-modal__rank-label">Ranked #${candidate.rank}</span>
                </div>
            </div>
        </div>

        <div class="candidate-modal__grid">
            <div class="candidate-modal__detail">
                <span class="candidate-modal__detail-icon">${ICON_LG.experience}</span>
                <div>
                    <span class="candidate-modal__detail-label">Experience</span>
                    <strong>${candidate.experience_years != null ? `${candidate.experience_years} years` : '—'}</strong>
                </div>
            </div>
            <div class="candidate-modal__detail">
                <span class="candidate-modal__detail-icon">${ICON_LG.english}</span>
                <div>
                    <span class="candidate-modal__detail-label">English Level</span>
                    <strong>${esc(candidate.english_level || '—')}</strong>
                </div>
            </div>
            <div class="candidate-modal__detail">
                <span class="candidate-modal__detail-icon">${ICON_LG.seniority}</span>
                <div>
                    <span class="candidate-modal__detail-label">Seniority</span>
                    <strong>${esc(candidate.seniority || '—')}</strong>
                </div>
            </div>

        </div>

        ${skillsHtml}
        ${aiHtml}
        ${testHtml}
    `;

    // Wire up event listeners on dynamically created elements
    const closeBtn = contentEl.querySelector('#closeCandidateModal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.close());

    const copyBtn = contentEl.querySelector('#copy-email-btn');
    if (copyBtn && email) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
                copyBtn.title = 'Copied!';
                showToast('Email copied to clipboard!', 'success');
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
                    copyBtn.title = 'Copy email';
                }, 2000);
            } catch (err) {
                showToast('Failed to copy email', 'error');
            }
        });
    }

    const copyGithubBtn = contentEl.querySelector('#copy-github-btn');
    if (copyGithubBtn && github_link) {
        copyGithubBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(github_link);
                copyGithubBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
                copyGithubBtn.title = 'Copied!';
                showToast('GitHub URL copied to clipboard!', 'success');
                setTimeout(() => {
                    copyGithubBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
                    copyGithubBtn.title = 'Copy GitHub URL';
                }, 2000);
            } catch (err) {
                showToast('Failed to copy GitHub URL', 'error');
            }
        });
    }

    const passBtn = contentEl.querySelector('#modal-pass-filter-btn');
    if (passBtn) passBtn.addEventListener('click', (e) => { e.stopPropagation(); handlePassToNextFilter(candidateId); });

    const discardBtn = contentEl.querySelector('#modal-discard-btn');
    if (discardBtn) discardBtn.addEventListener('click', (e) => { e.stopPropagation(); handleDiscardCandidate(candidateId); });

    const sendTestBtn = contentEl.querySelector('#modal-send-test-btn');
    if (sendTestBtn) sendTestBtn.addEventListener('click', (e) => { e.stopPropagation(); handleSendTest(candidateId); });

    // Close on backdrop click
    modal.onclick = (e) => { if (e.target === modal) modal.close(); };

    modal.showModal();
}


/* ── Render ─────────────────────────────────────────────────────── */

function renderCandidateCard(candidate, index, aiMap) {
    const pct = Math.round(candidate.final_match_percentage || 0);
    const ai = aiMap.get(String(candidate.candidate_id));
    const isTop = !!ai;

    const skills = candidate.matched_skills
        ? (typeof candidate.matched_skills === 'string' ? candidate.matched_skills.split(',') : candidate.matched_skills)
        : [];

    const sub = submissionsMap.get(String(candidate.candidate_id));

    // Build footer test area based on status
    let testBadgeHtml = '';
    let testActionsHtml = '';
    const savedStatuses = loadCandidateStatuses(currentOfferId);
    const savedStatus = savedStatuses[String(candidate.candidate_id)];

    if (cachedTestInfo) {
        if (sub && sub.status === 'completed') {
            const score = sub.score != null ? Math.round(sub.score) : '--';
            testBadgeHtml = `<span class="match-card__test-status match-card__test-status--completed">${ICON.check} ${score}%</span>`;

            if (savedStatus === 'passed') {
                testActionsHtml = `
                    <div class="match-card__actions">
                        <button class="match-card__view-results" data-candidate-id="${candidate.candidate_id}">View Results</button>
                        <span class="match-card__test-status match-card__test-status--passed">${ICON.check} Passed</span>
                    </div>`;
            } else if (savedStatus === 'discarded') {
                testActionsHtml = `
                    <div class="match-card__actions">
                        <span class="match-card__test-status match-card__test-status--discarded">${ICON.discard} Discarded</span>
                    </div>`;
            } else {
                testActionsHtml = `
                    <div class="match-card__actions">
                        <button class="match-card__view-results" data-candidate-id="${candidate.candidate_id}">View Results</button>
                        <button class="match-card__pass-filter" data-candidate-id="${candidate.candidate_id}">Pass to Next Filter ${ICON.arrow}</button>
                        <button class="match-card__discard" data-candidate-id="${candidate.candidate_id}">${ICON.discard} Discard</button>
                    </div>`;
            }
        } else if (sub) {
            testBadgeHtml = `<span class="match-card__test-status match-card__test-status--pending">${ICON.clock} Pending</span>`;
        } else {
            testBadgeHtml = `
                <button class="match-card__send-test" data-candidate-id="${candidate.candidate_id}">
                    ${ICON.test} Send Test
                </button>`;
        }
    }

    return `
    <article class="match-card${isTop ? ' match-card--ai' : ''}" data-candidate-id="${candidate.candidate_id}" role="button" tabindex="0">
        <div class="match-card__rank">#${index + 1}</div>

        <div class="match-card__body">
            <div class="match-card__header">
                <div>
                    <h3 class="match-card__name">${esc(getCandidateName(candidate))}</h3>
                    <span class="match-card__email">${esc(candidate.email || '')}</span>
                </div>
                <div class="match-card__score" style="--pct: ${pct}">
                    <svg class="match-card__gauge" viewBox="0 0 36 36">
                        <path class="match-card__gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path class="match-card__gauge-fill" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    </svg>
                    <span class="match-card__pct">${pct}%</span>
                </div>
            </div>

            <div class="match-card__meta">
                ${candidate.experience_years != null ? `<span class="match-card__tag">${ICON.experience} ${candidate.experience_years} yrs exp</span>` : ''}
                ${candidate.english_level ? `<span class="match-card__tag">${ICON.english} ${esc(candidate.english_level)}</span>` : ''}
                ${candidate.seniority ? `<span class="match-card__tag">${ICON.seniority} ${esc(candidate.seniority)}</span>` : ''}
            </div>

            ${skills.length > 0 ? `
            <div class="match-card__skills">
                ${skills.map(s => `<span class="match-card__skill">${esc(typeof s === 'string' ? s.trim() : s.name || s)}</span>`).join('')}
            </div>` : ''}

            ${isTop ? renderAiBadge(ai) : ''}

            <div class="match-card__footer">
                <span class="match-card__view-profile">View profile ${ICON.arrow}</span>
                ${testBadgeHtml}
            </div>
            ${testActionsHtml}
        </div>
    </article>`;
}

function renderAiBadge(ai) {
    const rec = REC_COLORS[ai.recommendation] || REC_COLORS.moderate;
    return `
    <div class="match-card__ai-section">
        <div class="match-card__ai-badge" style="background:${rec.bg}; border-color:${rec.border}; color:${rec.text};">
            AI: ${rec.label} match
            ${ai.fit_score != null ? ` · ${ai.fit_score}/100` : ''}
        </div>
        <button class="match-card__ai-toggle" type="button">View AI insight ▼</button>
        <div class="match-card__ai-detail">
            <p class="ai-insight">${esc(ai.insight || '')}</p>
            ${ai.strengths?.length ? `
            <div class="ai-list ai-list--strengths">
                <strong>Strengths</strong>
                <ul>${ai.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
            </div>` : ''}
            ${ai.risks?.length ? `
            <div class="ai-list ai-list--risks">
                <strong>Risks</strong>
                <ul>${ai.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
            </div>` : ''}
        </div>
    </div>`;
}

function emptyState(title, text) {
    return `
    <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__icon">${ICON.person}</div>
        <h2 class="empty-state__title">${title}</h2>
        <p class="empty-state__text">${text}</p>
        <a href="#/offers" class="btn btn--primary">Back to Offers</a>
    </div>`;
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
