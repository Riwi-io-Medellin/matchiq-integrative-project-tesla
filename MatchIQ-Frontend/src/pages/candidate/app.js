// ── Candidate SPA Entry Point ────────────────────────────────────
import { registerRoute, startRouter } from './router.js';
import { initDashboard } from './dashboard.js';
import { initProfile } from './profile.js';
import { initTests } from './tests.js';
import { authLogout } from '../../api/authApi.js';

// ── Helpers ──────────────────────────────────────────────────────

/** Toast notification */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/** Confirm modal */
export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        overlay.classList.add('is-open');

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        function cleanup(result) {
            overlay.classList.remove('is-open');
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

// ── Register routes ──────────────────────────────────────────────
registerRoute('dashboard', './dashboard.html', initDashboard);
registerRoute('profile', './profile.html', initProfile);
registerRoute('tests', './tests.html', initTests);

// ── Show layout immediately ──────────────────────────────────────
document.getElementById('mainLayout').style.display = '';

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

// ── Start router ─────────────────────────────────────────────────
startRouter();
