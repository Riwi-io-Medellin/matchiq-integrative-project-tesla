// ── Profile View Logic ──────────────────────────────────────────
// Vista de perfil con modo lectura y modo edición.

import { getCompanyProfile, updateCompanyProfile } from '../../api/companyApi.js';
import { showToast } from './app.js';

export async function initProfile() {
    const viewSection = document.getElementById('profile-view');
    const editSection = document.getElementById('profile-edit');
    const editBtn     = document.getElementById('btn-edit-profile');
    const cancelBtn   = document.getElementById('btn-cancel-edit');
    const form        = document.getElementById('profile-form');
    const alertEl     = document.getElementById('profile-alert');
    const saveBtn     = document.getElementById('profile-save-btn');

    const heroName   = document.getElementById('profile-hero-name');
    const heroEmail  = document.getElementById('profile-hero-email');
    const heroAvatar = document.getElementById('profile-avatar');
    const viewName   = document.getElementById('view-company-name');
    const viewEmail  = document.getElementById('view-email');
    const viewLoc    = document.getElementById('view-location');
    const viewWeb    = document.getElementById('view-website');
    const viewDesc   = document.getElementById('view-description');

    const nameInput = document.getElementById('profile-company-name');
    const locInput  = document.getElementById('profile-location');
    const webInput  = document.getElementById('profile-website');
    const descInput = document.getElementById('profile-description');

    let profileData = {};

    // ── Toggle helpers usando clases CSS ──
    function showViewMode() {
        viewSection?.classList.remove('is-hidden');
        editSection?.classList.add('is-hidden');
        editBtn?.classList.remove('is-hidden');
    }

    function showEditMode() {
        // Pre-llenar formulario
        if (nameInput) nameInput.value = profileData.company_name || '';
        if (locInput)  locInput.value  = profileData.location || '';
        if (webInput)  webInput.value  = profileData.website || '';
        if (descInput) descInput.value = profileData.description || '';
        clearErrors();
        hideAlert(alertEl);

        // Toggle secciones
        viewSection?.classList.add('is-hidden');
        editSection?.classList.remove('is-hidden');
        editBtn?.classList.add('is-hidden');
    }

    // ── Renderizar vista ──
    function renderView(p) {
        const name = p.company_name || 'Your Company';
        const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        if (heroAvatar) heroAvatar.textContent = initials;
        if (heroName) heroName.textContent = name;
        if (heroEmail) heroEmail.textContent = p.email || '—';

        if (viewName) viewName.textContent = p.company_name || '—';
        if (viewEmail) viewEmail.textContent = p.email || '—';
        if (viewLoc) viewLoc.textContent = p.location || '—';

        if (viewWeb) {
            viewWeb.innerHTML = p.website
                ? `<a href="${p.website}" target="_blank" class="link">${p.website}</a>`
                : '—';
        }

        if (viewDesc) viewDesc.textContent = p.description || 'No description provided.';
    }

    // ═══════ EVENTOS (siempre primero) ═══════
    editBtn?.addEventListener('click', () => {
        console.log('[Profile] Edit button clicked');
        showEditMode();
    });

    cancelBtn?.addEventListener('click', () => {
        console.log('[Profile] Cancel clicked');
        showViewMode();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(alertEl);
        clearErrors();

        const company_name = nameInput?.value.trim() || '';
        const location     = locInput?.value.trim() || '';
        const website      = webInput?.value.trim() || '';
        const description  = descInput?.value.trim() || '';

        if (!company_name) {
            nameInput?.classList.add('is-invalid');
            document.getElementById('err-company-name')?.classList.add('is-visible');
            nameInput?.focus();
            return;
        }

        if (saveBtn) saveBtn.disabled = true;
        const txt = saveBtn?.querySelector('.btn__text');
        if (txt) txt.textContent = 'Saving...';

        try {
            await updateCompanyProfile({ company_name, description, website, location });
            profileData = { ...profileData, company_name, description, website, location };
            renderView(profileData);
            showViewMode();
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            showAlert(alertEl, err.message || 'Error saving profile.', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
            if (txt) txt.textContent = 'Save Changes';
        }
    });

    [nameInput, locInput, webInput, descInput].forEach(input => {
        input?.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            input.closest('.form-group')?.querySelector('.form-error')?.classList.remove('is-visible');
        });
    });

    // ═══════ CARGAR DATOS (al final) ═══════
    try {
        profileData = await getCompanyProfile();
        renderView(profileData);
    } catch (err) {
        console.error('[Profile] Error loading:', err);
        showAlert(alertEl, 'Could not load profile data. You can still edit.', 'error');
    }
}

function showAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `profile-alert profile-alert--${type}`;
    el.hidden = false;
}

function hideAlert(el) {
    if (!el) return;
    el.hidden = true;
}

function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.form-error.is-visible').forEach(el => el.classList.remove('is-visible'));
}
