// ── Candidate Tests Page ────────────────────────────────────────
// Shows tests assigned by companies and lets candidates resolve them.
import { showConfirmModal, showToast } from './app.js';

import { authMe } from '../../api/authApi.js';
import { getCandidateProfile } from '../../api/candidateApi.js';
import {
    getMyInvitations,
    getGorillaTest,
    submitGorillaTest,
} from '../../api/testsApi.js';

const $ = (sel) => document.querySelector(sel);

let state = {
    user: null,
    tests: [],
    currentTest: null,
    currentAssignment: null,
    answers: {},
    timerInterval: null,
    timeLeft: 0,
};



// ── Render Tests List ─────────────────────────────────────────────
async function renderTestsList() {
    const container = $('#testsContainer');
    const assignments = await getMyInvitations();
    state.tests = assignments;

    const pending = assignments.filter(a => a.status === 'pending');
    const completed = assignments.filter(a => a.status === 'completed');

    $('#pendingCount').textContent = pending.length;
    $('#completedCount').textContent = completed.length;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state test-empty">
                <div style="margin-bottom: 12px; opacity: 0.4;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>
                <p>You don't have any assigned tests yet.</p>
                <p style="font-size: 13px; opacity: 0.7;">Companies will send you tests when they're interested in your profile.</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="tests-list">
            ${assignments.map(a => renderTestCard(a)).join('')}
        </div>`;

    // Bind click events
    container.querySelectorAll('.test-card__action').forEach(btn => {
        btn.addEventListener('click', () => {
            const offerId = btn.dataset.offerId;
            const assignment = assignments.find(a => (a.offerId || a.offer_id) === offerId);
            if (assignment) startTest(assignment);
        });
    });
}

function renderTestCard(assignment) {
    const isCompleted = assignment.status === 'completed';
    const dateVal = assignment.assigned_at || assignment.created_at || assignment.sentAt;
    const sentDate = dateVal
        ? new Date(dateVal).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Recently';
    const offerId = assignment.offerId || assignment.offer_id;
    const title = assignment.offerTitle || assignment.offer_title || 'Gorilla Test';
    const company = assignment.companyName || assignment.company_name || 'Company';

    const iconDone = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#10b981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    const iconPending = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="var(--bg-800)" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`;

    return `
    <div class="test-card ${isCompleted ? 'test-card--completed' : ''}">
        <div class="test-card__left">
            <div class="test-card__icon">${isCompleted ? iconDone : iconPending}</div>
            <div class="test-card__info">
                <h4 class="test-card__title">${esc(title)}</h4>
                <p class="test-card__company">${esc(company)}</p>
                <span class="test-card__date">Sent on ${sentDate}</span>
            </div>
        </div>
        <div class="test-card__right">
            <span class="test-card__status ${isCompleted ? 'test-card__status--done' : 'test-card__status--pending'}">
                ${isCompleted ? 'Completed' : 'Pending'}
            </span>
            ${!isCompleted ? `
            <button class="btn btn--primary test-card__action" data-offer-id="${offerId}">
                Solve
            </button>` : ''}
        </div>
    </div>`;
}

// ── Start Test ────────────────────────────────────────────────────
async function startTest(assignment) {
    try {
        // Show loading
        $('#testsListView').style.display = 'none';
        $('#testTakingView').style.display = '';
        $('#testResultsView').style.display = 'none';

        $('#testQuestionsContainer').innerHTML = `
            <div class="page-loader-overlay" style="position: relative; min-height: 200px; background: transparent;">
                <div class="page-loader-overlay__spinner"></div>
                <span class="page-loader-overlay__text">Loading test…</span>
            </div>`;

        // Fetch the test
        const test = await getGorillaTest(assignment.offerId || assignment.offer_id);
        state.currentTest = test;
        state.currentAssignment = assignment;
        state.answers = {};

        $('#testTitle').textContent = test.test_title || 'Gorilla Test';

        // Start timer
        state.timeLeft = (test.time_limit_minutes || 30) * 60;
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            if (state.timeLeft <= 0) {
                clearInterval(state.timerInterval);
                autoSubmitTest();
            }
        }, 1000);

        // Render questions
        renderQuestions(test.questions);

    } catch (err) {
        console.error('Error loading test:', err);
        $('#testQuestionsContainer').innerHTML = `
            <div class="alert is-error" style="text-align: center;">
                We couldn't load the test right now. Please go back and try again.
            </div>`;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    const timer = $('#testTimer');
    timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (state.timeLeft <= 60) {
        timer.classList.add('test-timer--danger');
    }
}

function renderQuestions(questions) {
    const container = $('#testQuestionsContainer');
    state.currentQuestionIndex = 0;

    // Build all question HTML but only show one at a time
    container.innerHTML = `
        <!-- Question indicator dots -->
        <div class="test-indicator" id="questionIndicator">
            ${questions.map((_, idx) => `
                <button class="test-indicator__dot ${idx === 0 ? 'test-indicator__dot--current' : ''}"
                    data-goto="${idx}" title="Question ${idx + 1}">
                    ${idx + 1}
                </button>
            `).join('')}
        </div>

        <!-- Single question container -->
        <div id="activeQuestion"></div>

        <!-- Navigation -->
        <div class="test-nav" id="testNav">
            <button class="btn btn--ghost" id="prevQuestionBtn" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                Previous
            </button>
            <span class="test-nav__counter" id="questionCounter">1 / ${questions.length}</span>
            <button class="btn btn--primary" id="nextQuestionBtn">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>
    `;

    // Navigation handlers
    $('#prevQuestionBtn').addEventListener('click', () => navigateQuestion(-1, questions));
    $('#nextQuestionBtn').addEventListener('click', () => navigateQuestion(1, questions));

    // Dot click navigation
    container.querySelectorAll('.test-indicator__dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.currentQuestionIndex = parseInt(dot.dataset.goto);
            showQuestion(questions);
        });
    });

    // Show first question
    showQuestion(questions);
}

function showQuestion(questions) {
    const idx = state.currentQuestionIndex;
    const q = questions[idx];
    const total = questions.length;
    const container = $('#activeQuestion');
    const previousAnswer = state.answers[String(idx + 1)];

    container.innerHTML = `
        <div class="test-question test-question--active" style="animation: fadeSlideIn 0.3s ease">
            <div class="test-question__header">
                <span class="test-question__number">Question ${idx + 1} of ${total}</span>
                ${q.difficulty ? `<span class="test-question__difficulty test-question__difficulty--${q.difficulty}">${esc(q.difficulty)}</span>` : ''}
            </div>
            <h4 class="test-question__text">${esc(q.question)}</h4>
            <div class="test-question__options">
                ${Object.entries(q.options || {}).map(([key, value]) => `
                    <label class="test-option ${previousAnswer === key ? 'test-option--selected' : ''}" data-option="${key}">
                        <input type="radio" name="q${idx + 1}" value="${key}" ${previousAnswer === key ? 'checked' : ''} />
                        <span class="test-option__check"></span>
                        <span class="test-option__label">
                            <strong>${key}.</strong> ${esc(value)}
                        </span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;

    // Bind option selection
    container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.answers[String(idx + 1)] = e.target.value;

            // Update visual
            container.querySelectorAll('.test-option').forEach(opt =>
                opt.classList.remove('test-option--selected'));
            e.target.closest('.test-option').classList.add('test-option--selected');

            updateProgress(total);
            updateIndicator(questions);

            // Auto-advance after a short delay
            if (idx < total - 1) {
                setTimeout(() => {
                    state.currentQuestionIndex++;
                    showQuestion(questions);
                }, 400);
            } else {
                // Last question answered — enable submit
                updateNavButtons(questions);
            }
        });
    });

    updateNavButtons(questions);
    updateIndicator(questions);
    updateProgress(total);

    // Counter
    $('#questionCounter').textContent = `${idx + 1} / ${total}`;
}

function navigateQuestion(direction, questions) {
    const newIdx = state.currentQuestionIndex + direction;
    if (newIdx < 0 || newIdx >= questions.length) return;
    state.currentQuestionIndex = newIdx;
    showQuestion(questions);
}

function updateNavButtons(questions) {
    const idx = state.currentQuestionIndex;
    const total = questions.length;
    const answered = Object.keys(state.answers).length;

    $('#prevQuestionBtn').disabled = idx === 0;

    const nextBtn = $('#nextQuestionBtn');
    if (idx === total - 1) {
        // Last question — show submit if all answered
        if (answered >= total) {
            nextBtn.innerHTML = `Submit <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
            nextBtn.className = 'btn btn--primary';
            nextBtn.disabled = false;
            nextBtn.onclick = () => {
                const modal = $('#submitConfirmModal');
                if (modal) modal.showModal();
            };
        } else {
            nextBtn.innerHTML = `${answered}/${total} answered`;
            nextBtn.className = 'btn btn--ghost';
            nextBtn.disabled = true;
        }
    } else {
        nextBtn.innerHTML = `Next <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`;
        nextBtn.className = 'btn btn--primary';
        nextBtn.disabled = false;
        nextBtn.onclick = () => navigateQuestion(1, questions);
    }
}

function updateIndicator(questions) {
    const dots = document.querySelectorAll('.test-indicator__dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('test-indicator__dot--current', 'test-indicator__dot--answered');
        if (i === state.currentQuestionIndex) {
            dot.classList.add('test-indicator__dot--current');
        }
        if (state.answers[String(i + 1)]) {
            dot.classList.add('test-indicator__dot--answered');
        }
    });
}

function updateProgress(total) {
    const answered = Object.keys(state.answers).length;
    const pct = Math.round((answered / total) * 100);
    $('#testProgressBar').style.width = `${pct}%`;

    const submitBtn = $('#submitTestBtn');
    if (submitBtn) {
        submitBtn.disabled = answered < total;
        submitBtn.textContent = answered < total
            ? `Submit answers (${answered}/${total})`
            : 'Submit answers';
    }
}

// ── Submit Test ───────────────────────────────────────────────────
async function autoSubmitTest() {
    await doSubmitTest();
}

async function doSubmitTest() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    // Disable navigation during submit
    const nextBtn = $('#nextQuestionBtn');
    const prevBtn = $('#prevQuestionBtn');
    if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Submitting…'; }
    if (prevBtn) prevBtn.disabled = true;

    try {
        const candidateId = state.candidateId || state.user.id;
        const result = await submitGorillaTest(
            state.currentTest.id,
            candidateId,
            state.answers
        );

        // Show success and redirect to dashboard
        showToast('Test submitted successfully!', 'success');
        showResults(result);
    } catch (err) {
        console.error('Submit error:', err);

        // If already submitted, still show the view
        if (err.message?.includes('already submitted')) {
            showToast('This test was already submitted.', 'success');
            showResults({
                evaluation: { percentage_score: 0, correct_answers: '?', total_questions: '?', attention_level: '?' },
                message: 'It looks like you have already submitted this test.',
            });
        } else {
            if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = 'Retry Submit'; }
            if (prevBtn) prevBtn.disabled = false;
            showToast('Something went wrong while submitting your answers. Please try again.', 'error');
        }
    }
}

function showResults(result) {
    $('#testsListView').style.display = 'none';
    $('#testTakingView').style.display = 'none';
    $('#testResultsView').style.display = '';

    const eval_ = result.evaluation || {};
    const score = eval_.percentage_score ?? 0;

    $('#resultScore').textContent = `${Math.round(score)}%`;
    $('#resultCorrect').textContent = `${eval_.correct_answers ?? '—'}/${eval_.total_questions ?? '—'}`;
    $('#resultAttention').textContent = eval_.attention_level || '—';

    const trophySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#f59e0b" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`;
    const thumbsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--emerald-dark)" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`;
    const studySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--blue-500)" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>`;

    if (score >= 80) {
        $('#resultIcon').innerHTML = trophySvg;
        $('#resultSubtitle').textContent = 'Excellent result! You have demonstrated great mastery.';
    } else if (score >= 50) {
        $('#resultIcon').innerHTML = thumbsUpSvg;
        $('#resultSubtitle').textContent = 'Good job. Keep improving your skills.';
    } else {
        $('#resultIcon').innerHTML = studySvg;
        $('#resultSubtitle').textContent = 'Keep studying. You can improve.';
    }

    if (result.message && result.message.includes('already')) {
        $('#resultSubtitle').textContent = result.message;
    }

    // Change "Back to Tests" button to redirect to dashboard
    const backBtn = $('#backToTestsBtn');
    if (backBtn) {
        backBtn.textContent = 'Back to Dashboard';
        backBtn.onclick = () => {
            window.location.hash = '#/dashboard';
        };
    }
}

// ── Navigation ────────────────────────────────────────────────────
async function showTestsList() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    $('#testsListView').style.display = '';
    $('#testTakingView').style.display = 'none';
    $('#testResultsView').style.display = 'none';
    await renderTestsList();
}

// ── Utility ───────────────────────────────────────────────────────
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

// ── Init ──────────────────────────────────────────────────────────
export async function initTests() {
    let user = window.__candidateUser;
    if (!user) {
        try {
            const me = await authMe();
            if (me?.authenticated && me?.user?.role === 'candidate') {
                user = me.user;
                window.__candidateUser = user;
            } else {
                window.location.href = '../login.html';
                return;
            }
        } catch {
            window.location.href = '../login.html';
            return;
        }
    }

    state.user = user;

    // Fetch candidate profile to get the correct candidate_id for submissions
    try {
        const profile = await getCandidateProfile();
        state.candidateId = profile.id || profile.candidate_id;
    } catch (err) {
        console.warn('Could not fetch candidate profile for ID:', err);
    }

    await renderTestsList();

    // Back button
    $('#backToListBtn')?.addEventListener('click', async () => {
        const confirmed = await showConfirmModal(
            'Leave Test?',
            'Are you sure you want to leave? You will lose your current progress.'
        );
        if (confirmed) showTestsList();
    });

    // Submit button → open confirmation modal
    $('#submitTestBtn')?.addEventListener('click', () => {
        const modal = $('#submitConfirmModal');
        if (modal) modal.showModal();
    });

    // Confirm submit inside modal
    $('#confirmSubmitBtn')?.addEventListener('click', () => {
        $('#submitConfirmModal')?.close();
        doSubmitTest();
    });

    // Cancel submit — go back to reviewing
    $('#cancelSubmitBtn')?.addEventListener('click', () => {
        $('#submitConfirmModal')?.close();
    });

    // Close modal on backdrop click
    $('#submitConfirmModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
    });

    // Back to tests from results
    $('#backToTestsBtn')?.addEventListener('click', showTestsList);
}
