// ── Offer Create/Edit View Logic ────────────────────────────────
// Maneja formulario de creación y edición de ofertas.
// Categorías y skills se obtienen del backend (catálogo).

import { createOffer, getOfferById, updateOffer } from '../../api/offersApi.js';
import { getCategories, getSkillsByCategory } from '../../api/catalogApi.js';
import { showToast } from './app.js';
import { navigateTo } from './router.js';

/** @type {Array<{id: string, name: string}>} */  let allCategories = [];
/** @type {Array<{id: string, name: string}>} */  let selectedCategories = [];
/** @type {Array<{id: string, name: string}>} */  let selectedSkills = [];

// Cache de skills por categoría (evita re-fetch)
/** @type {Map<string, Array<{id: string, name: string}>>} */
const skillsCache = new Map();

/**
 * Inicializa la vista de crear/editar oferta.
 * @param {{ id?: string }} params
 */
export async function initOfferCreate(params = {}) {
    selectedCategories = [];
    selectedSkills = [];
    skillsCache.clear();

    const isEdit = !!params.id;

    // Show loader while data loads
    const form = document.getElementById('offer-form');
    if (form) form.style.opacity = '0';

    // Títulos
    const titleEl = document.getElementById('form-title');
    const subtitleEl = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('btn-submit');

    if (isEdit) {
        if (titleEl) titleEl.textContent = 'Edit Offer';
        if (subtitleEl) subtitleEl.textContent = 'Modify the job offer data.';
        const btnText = submitBtn?.querySelector('.btn__text');
        if (btnText) btnText.textContent = 'Update Offer';
    }

    // Cargar categorías del backend
    try {
        allCategories = await getCategories();
    } catch (e) {
        showToast('Error loading categories.', 'error');
        allCategories = [];
    }

    // Setup custom multiselect dropdowns
    setupCategoryMultiselect();
    renderCategoryOptions();
    renderSkillOptions();

    // Salary auto-format
    setupSalaryFormatter();

    // Click outside to close dropdowns
    document.addEventListener('click', handleClickOutside);

    // Si es edición, poblar formulario
    if (isEdit) {
        try {
            const offer = await getOfferById(params.id);
            if (offer) await populateForm(offer);
        } catch (e) {
            showToast('Error loading offer.', 'error');
        }
    }

    // Show form after data loads
    if (form) {
        form.style.opacity = '1';
        form.style.transition = 'opacity 0.3s ease';
    }

    // Submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Prevent double-click
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        const data = collectFormData();
        console.log(data);

        try {
            if (isEdit) {
                await updateOffer(params.id, data);
                showToast('Offer updated successfully.');
            } else {
                await createOffer(data);
                showToast('Offer created successfully.');
            }
            navigateTo('offers');
        } catch (err) {
            showToast(err.message || 'Error saving offer.', 'error');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    });
}

/* ── Custom Multiselect Component ──────────────────────────────── */

function handleClickOutside(e) {
    const catMs = document.getElementById('categories-multiselect');
    const sklMs = document.getElementById('skills-multiselect');

    if (catMs && !catMs.contains(e.target)) {
        catMs.classList.remove('is-open');
    }
    if (sklMs && !sklMs.contains(e.target)) {
        sklMs.classList.remove('is-open');
    }
}

function setupCategoryMultiselect() {
    // Toggle category dropdown
    const catControl = document.getElementById('categories-control');
    if (catControl) {
        catControl.addEventListener('click', () => {
            const ms = document.getElementById('categories-multiselect');
            ms.classList.toggle('is-open');
            // Close skills when opening categories
            document.getElementById('skills-multiselect')?.classList.remove('is-open');
        });
    }

    // Toggle skills dropdown
    const sklControl = document.getElementById('skills-control');
    if (sklControl) {
        sklControl.addEventListener('click', () => {
            if (selectedCategories.length === 0) return;
            const ms = document.getElementById('skills-multiselect');
            ms.classList.toggle('is-open');
            // Close categories when opening skills
            document.getElementById('categories-multiselect')?.classList.remove('is-open');
        });
    }
}

function renderCategoryOptions() {
    const container = document.getElementById('categories-options');
    if (!container) return;

    container.innerHTML = '';

    if (allCategories.length === 0) {
        container.innerHTML = '<div class="multiselect__empty">No categories available</div>';
        return;
    }

    allCategories.forEach(cat => {
        const isSelected = selectedCategories.some(s => s.id === cat.id);
        const opt = document.createElement('div');
        opt.className = `multiselect__option${isSelected ? ' is-selected' : ''}`;
        opt.dataset.id = cat.id;
        opt.innerHTML = `<span class="multiselect__check"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span><span>${esc(cat.name)}</span>`;

        opt.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isSelected) {
                // Deselect
                selectedCategories = selectedCategories.filter(s => s.id !== cat.id);
                // Remove skills from this category too
                const catSkills = skillsCache.get(cat.id) || [];
                selectedSkills = selectedSkills.filter(s => !catSkills.some(cs => cs.id === s.id));
            } else {
                selectedCategories.push({ id: cat.id, name: cat.name });
            }
            renderCategoryTags();
            renderCategoryOptions();
            await renderSkillOptions();
            renderSkillTags();
        });

        container.appendChild(opt);
    });
}

async function renderSkillOptions() {
    const container = document.getElementById('skills-options');
    if (!container) return;

    if (selectedCategories.length === 0) {
        container.innerHTML = '<div class="multiselect__empty">Select a category first</div>';
        return;
    }

    container.innerHTML = '';
    let hasOptions = false;

    for (const cat of selectedCategories) {
        if (!skillsCache.has(cat.id)) {
            try {
                const skills = await getSkillsByCategory(cat.id);
                skillsCache.set(cat.id, skills);
            } catch (e) {
                skillsCache.set(cat.id, []);
            }
        }

        const catSkills = skillsCache.get(cat.id) || [];
        if (catSkills.length === 0) continue;

        // Group label
        const lbl = document.createElement('div');
        lbl.className = 'multiselect__group-label';
        lbl.textContent = cat.name;
        container.appendChild(lbl);

        catSkills.forEach(skill => {
            const isSelected = selectedSkills.some(s => s.id === skill.id);
            const opt = document.createElement('div');
            opt.className = `multiselect__option${isSelected ? ' is-selected' : ''}`;
            opt.dataset.id = skill.id;
            opt.innerHTML = `<span class="multiselect__check"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span><span>${esc(skill.name)}</span>`;

            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isSelected) {
                    selectedSkills = selectedSkills.filter(s => s.id !== skill.id);
                } else {
                    selectedSkills.push({ id: skill.id, name: skill.name });
                }
                renderSkillOptions();
                renderSkillTags();
            });

            container.appendChild(opt);
            hasOptions = true;
        });
    }

    if (!hasOptions) {
        container.innerHTML = '<div class="multiselect__empty">No technologies available</div>';
    }
}

function renderCategoryTags() {
    const tagsContainer = document.getElementById('categories-tags');
    if (!tagsContainer) return;

    tagsContainer.innerHTML = '';

    if (selectedCategories.length === 0) {
        tagsContainer.innerHTML = '<span class="multiselect__placeholder">Select categories…</span>';
        return;
    }

    selectedCategories.forEach(cat => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${esc(cat.name)}<button type="button" class="tag-chip__remove" data-id="${cat.id}">&times;</button>`;

        chip.querySelector('.tag-chip__remove').addEventListener('click', async (e) => {
            e.stopPropagation();
            selectedCategories = selectedCategories.filter(s => s.id !== cat.id);
            // Remove skills from this category
            const catSkills = skillsCache.get(cat.id) || [];
            selectedSkills = selectedSkills.filter(s => !catSkills.some(cs => cs.id === s.id));
            renderCategoryTags();
            renderCategoryOptions();
            await renderSkillOptions();
            renderSkillTags();
        });

        tagsContainer.appendChild(chip);
    });
}

function renderSkillTags() {
    const tagsContainer = document.getElementById('skills-tags');
    if (!tagsContainer) return;

    tagsContainer.innerHTML = '';

    if (selectedSkills.length === 0) {
        const placeholder = selectedCategories.length === 0
            ? 'Select a category first'
            : 'Select technologies…';
        tagsContainer.innerHTML = `<span class="multiselect__placeholder">${placeholder}</span>`;
        return;
    }

    selectedSkills.forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${esc(skill.name)}<button type="button" class="tag-chip__remove" data-id="${skill.id}">&times;</button>`;

        chip.querySelector('.tag-chip__remove').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedSkills = selectedSkills.filter(s => s.id !== skill.id);
            renderSkillTags();
            renderSkillOptions();
        });

        tagsContainer.appendChild(chip);
    });
}

/* ── Form Helpers ──────────────────────────────────────────────── */

function collectFormData() {
    const rawSalary = val('of-salary').replace(/\./g, '');
    return {
        title: val('of-title'),
        description: val('of-description'),
        salary: parseFloat(rawSalary) || 0,
        modality: val('of-modality'),
        min_experience_years: parseInt(val('of-experience')) || 0,
        required_english_level: val('of-english'),
        positions_available: parseInt(val('of-positions')) || 1,
        category_ids: selectedCategories.map(c => c.id),
        skill_ids: selectedSkills.map(s => s.id)
    };
}

async function populateForm(offer) {
    setVal('of-id', offer.id);
    setVal('of-title', offer.title);
    setVal('of-experience', offer.min_experience_years);
    setVal('of-english', offer.required_english_level);
    setVal('of-modality', offer.modality);
    setVal('of-salary', formatCOP(offer.salary));
    setVal('of-description', offer.description);

    // Poblar categorías (backend devuelve [{id, name}])
    if (offer.categories && offer.categories.length > 0) {
        selectedCategories.push(...offer.categories);
        renderCategoryTags();
        renderCategoryOptions();
    }

    // Poblar skills (backend devuelve [{id, name, category}])
    if (offer.skills && offer.skills.length > 0) {
        selectedSkills.push(...offer.skills.map(s => ({ id: s.id, name: s.name })));
        renderSkillTags();
    }

    await renderSkillOptions();
}

function validateForm() {
    let valid = true;

    valid = checkRequired('of-title', 'err-title') && valid;
    valid = checkRequired('of-english', 'err-english') && valid;
    valid = checkRequired('of-modality', 'err-modality') && valid;
    valid = checkRequired('of-description', 'err-description') && valid;

    // Tags
    if (selectedCategories.length === 0) {
        showError('err-categories'); valid = false;
    } else { hideError('err-categories'); }

    if (selectedSkills.length === 0) {
        showError('err-skills'); valid = false;
    } else { hideError('err-skills'); }

    return valid;
}

function checkRequired(inputId, errorId) {
    const v = val(inputId);
    if (!v) { showError(errorId); return false; }
    hideError(errorId);
    return true;
}

function showError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('is-visible');
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-visible');
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v || '';
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

/* ── Salary Formatter (COP) ───────────────────────────────────── */

function formatCOP(value) {
    const num = String(value).replace(/\D/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function setupSalaryFormatter() {
    const input = document.getElementById('of-salary');
    if (!input) return;

    input.addEventListener('input', () => {
        const cursorPos = input.selectionStart;
        const oldLen = input.value.length;
        const raw = input.value.replace(/\D/g, '');
        input.value = formatCOP(raw);
        const newLen = input.value.length;
        const newPos = Math.max(0, cursorPos + (newLen - oldLen));
        input.setSelectionRange(newPos, newPos);
    });
}
