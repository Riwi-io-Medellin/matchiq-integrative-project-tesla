import { registerRoute, startRouter } from './router.js';
import { initDashboard } from './dashboard.js';
import { initOfferCreate } from './offerCreate.js';
import { initOffers } from './offers.js';
import { initMatches } from './matches.js';
import { initProfile } from './profile.js';
import { authMe, authLogout } from '../../api/authApi.js';
import { getCompanyProfile, updateCompanyProfile } from '../../api/companyApi.js';

// ── Helpers globales ─────────────────────────────────────────────

/** Toast notification */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/** Modal de confirmación */
export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirm-dialog');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        dialog.showModal();

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        function cleanup(result) {
            dialog.close();
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onConfirm() { cleanup(true); }
        function onCancel() { cleanup(false); }

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

/** Offer Details Modal */
export function showOfferModal(offer, actionsHtml, onActionClick) {
    const overlay = document.getElementById('offer-modal-overlay');
    if (!overlay) return;

    document.getElementById('offer-modal-title').textContent = offer.title || 'Offer Details';

    const statusMap = {
        open: '<span class="pill pill--active">Open</span>',
        active: '<span class="pill pill--active">Active</span>',
        in_process: '<span class="pill pill--in-process">In Process</span>',
        closed: '<span class="pill pill--closed">Closed</span>',
        cancelled: '<span class="pill pill--closed">Closed</span>',
    };
    document.getElementById('offer-modal-status').innerHTML = statusMap[offer.status] || `<span class="pill">${offer.status}</span>`;

    const categories = (offer.categories || []).map(t => typeof t === 'object' ? t.name : t);
    const skills = (offer.skills || []).map(t => typeof t === 'object' ? t.name : t);
    let metaHtml = '';
    if (categories.length > 0) {
        metaHtml += `<div style="margin-bottom: 8px;"><strong style="color: var(--text-600); font-size: 0.8rem; display: block; margin-bottom: 4px;">Categories</strong><div style="display: flex; flex-wrap: wrap; gap: 6px;">${categories.map(t => `<span class="offer-card__tag">${t}</span>`).join('')}</div></div>`;
    }
    if (skills.length > 0) {
        metaHtml += `<div><strong style="color: var(--text-600); font-size: 0.8rem; display: block; margin-bottom: 4px;">Skills</strong><div style="display: flex; flex-wrap: wrap; gap: 6px;">${skills.map(t => `<span class="offer-card__tag" style="background: rgba(16,185,129,0.10); color: #059669; border-color: rgba(16,185,129,0.25);">${t}</span>`).join('')}</div></div>`;
    }
    document.getElementById('offer-modal-meta').innerHTML = metaHtml;

    const modalityMap = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };
    document.getElementById('offer-modal-exp').textContent = offer.min_experience_years ? `${offer.min_experience_years} years` : '0 years';
    document.getElementById('offer-modal-eng').textContent = offer.required_english_level || '—';
    document.getElementById('offer-modal-mod').textContent = modalityMap[offer.modality] || offer.modality || '—';
    document.getElementById('offer-modal-sal').textContent = offer.salary ? `$${offer.salary.toLocaleString('en-US')} COP` : 'Not specified';

    document.getElementById('offer-modal-desc').textContent = offer.description || 'No description provided.';

    const actionsContainer = document.getElementById('offer-modal-actions');
    actionsContainer.innerHTML = (actionsHtml || '') + `<button class="btn btn--outline" id="offer-modal-close">Close</button>`;

    const clickHandler = (e) => {
        if (e.target.id === 'offer-modal-close') {
            closeModal();
            return;
        }
        if (onActionClick) {
            onActionClick(e, closeModal);
        }
    };

    actionsContainer.addEventListener('click', clickHandler);

    function closeModal() {
        overlay.classList.remove('is-open');
        actionsContainer.removeEventListener('click', clickHandler);
    }

    overlay.classList.add('is-open');
}

// ── Register routes ──────────────────────────────────────────────

registerRoute('dashboard', './dashboard.html', initDashboard);
registerRoute('offers/create', './offerCreate.html', initOfferCreate);
registerRoute('offers', './offers.html', initOffers);
registerRoute('offers/edit', './offerCreate.html', initOfferCreate);
registerRoute('matches', './matches.html', initMatches);
registerRoute('profile', './profile.html', initProfile);

// ── Theme Toggle ─────────────────────────────────────────────
const LOGO_LIGHT = '../../src/assets/iconoMatchIQ.png';
const LOGO_DARK  = '../../src/assets/iconoMatchIQ-light.png';

function updateThemeUI(isDark) {
    const label = document.querySelector('.theme-toggle__label');
    const logo  = document.querySelector('.brand__mark');
    if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (logo)  logo.src = isDark ? LOGO_DARK : LOGO_LIGHT;
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('matchiq_theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('matchiq_theme', 'dark');
    }
    updateThemeUI(!isDark);
});

// Set initial label + logo
updateThemeUI(document.documentElement.getAttribute('data-theme') === 'dark');

// ── Logout ───────────────────────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await authLogout();
    window.location.href = '../login.html';
});

// ── Company Onboarding ───────────────────────────────────────────

function showOnboarding() {
    document.getElementById('companyOnboarding')?.classList.remove('onboarding--hidden');
}

function hideOnboarding() {
    document.getElementById('companyOnboarding')?.classList.add('onboarding--hidden');
}

function setObAlert(msg) {
    const el = document.getElementById('coOnboardingAlert');
    if (!el) return;
    if (!msg) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = msg;
}

function initOnboarding(onComplete) {
    const step1 = document.getElementById('co-step-1');
    const step2 = document.getElementById('co-step-2');
    const progressBar = document.getElementById('co-progressBar');

    function goToStep(n) {
        step1?.classList.toggle('ob-step--hidden', n !== 1);
        step2?.classList.toggle('ob-step--hidden', n !== 2);
        if (progressBar) progressBar.style.width = n === 1 ? '50%' : '100%';
    }

    goToStep(1);

    // Step 1 → Step 2
    document.getElementById('co_nextStep1')?.addEventListener('click', () => {
        const name = document.getElementById('co_companyName')?.value.trim();
        if (!name) {
            setObAlert('Company name is required.');
            return;
        }
        setObAlert('');
        goToStep(2);
    });

    // Step 2 ← Back
    document.getElementById('co_backStep2')?.addEventListener('click', () => {
        setObAlert('');
        goToStep(1);
    });

    // Step 2 → Save
    document.getElementById('co_saveBtn')?.addEventListener('click', async () => {
        const company_name = document.getElementById('co_companyName')?.value.trim();
        const location = document.getElementById('co_location')?.value.trim() || '';
        const website = document.getElementById('co_website')?.value.trim() || '';
        const description = document.getElementById('co_description')?.value.trim() || '';

        if (!company_name) {
            setObAlert('Company name is required.');
            goToStep(1);
            return;
        }

        const btn = document.getElementById('co_saveBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

        try {
            await updateCompanyProfile({ company_name, description, website, location });
            hideOnboarding();
            showToast('Profile saved! Welcome to MatchIQ.');
            if (onComplete) onComplete();
        } catch (err) {
            setObAlert(err.message || 'Error saving profile.');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Complete Profile'; }
        }
    });
}

// ── Boot ─────────────────────────────────────────────────────────

(async function boot() {
    // 1. Auth check
    try {
        const me = await authMe();
        if (!me?.authenticated || me?.user?.role !== 'company') {
            window.location.href = '../login.html';
            return;
        }
    } catch {
        window.location.href = '../login.html';
        return;
    }

    // 2. Profile check
    let profile = null;
    try {
        profile = await getCompanyProfile();
    } catch {
        // No profile yet — show onboarding
    }

    const isComplete = profile && profile.company_name && profile.company_name.trim() !== '';

    if (!isComplete) {
        // Show onboarding, start router after completion
        initOnboarding(() => startRouter());
        showOnboarding();
    } else {
        // Profile exists — go straight to dashboard
        startRouter();
    }
})();
