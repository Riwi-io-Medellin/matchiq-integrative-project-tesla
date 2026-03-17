import { authMe, authLogout } from "../../api/authApi.js";
import {
  getDashboard,
  getCompanies, getCompanyById,
  getCandidates, getCandidateById,
  toggleUserStatus,
  getCategories, getAllSkills,
  createCategory, createSkill,
  deleteCategory, deleteSkill,
} from "../../api/adminApi.js";

// ── DOM Utilities ─────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function showError(message) {
  console.error(message);
}

// ── Custom Confirm / Notification Modal ───────────────────────────────────────
function showConfirm({ title, message, confirmText = 'Confirm', danger = true }) {
  return new Promise((resolve) => {
    const modal = $("#modal-confirm");
    const overlay = $("#overlay");
    $("#confirm-title").textContent = title || 'Are you sure?';
    $("#confirm-message").textContent = message || 'This action cannot be undone.';

    const okBtn = $("#confirm-ok-btn");
    okBtn.textContent = confirmText;
    okBtn.className = `btn ${danger ? 'btn--danger' : 'btn--primary'}`;

    const iconWrap = $("#confirm-icon");
    if (danger) {
      iconWrap.style.background = 'var(--red-light)';
      iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconWrap.style.background = 'var(--emerald-light)';
      iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
    }

    modal.classList.remove("modal--hidden");
    overlay.classList.remove("overlay--hidden");

    function cleanup() {
      modal.classList.add("modal--hidden");
      overlay.classList.add("overlay--hidden");
      okBtn.removeEventListener("click", onConfirm);
      $("#confirm-cancel-btn").removeEventListener("click", onCancel);
    }
    function onConfirm() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }

    okBtn.addEventListener("click", onConfirm);
    $("#confirm-cancel-btn").addEventListener("click", onCancel);
  });
}

function showNotification({ title, message, isError = true }) {
  const modal = $("#modal-confirm");
  const overlay = $("#overlay");
  $("#confirm-title").textContent = title || (isError ? 'Error' : 'Success');
  $("#confirm-message").textContent = message;

  const iconWrap = $("#confirm-icon");
  if (isError) {
    iconWrap.style.background = 'var(--red-light)';
    iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else {
    iconWrap.style.background = 'var(--emerald-light)';
    iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  }

  $("#confirm-ok-btn").style.display = 'none';
  $("#confirm-cancel-btn").textContent = 'Close';

  modal.classList.remove("modal--hidden");
  overlay.classList.remove("overlay--hidden");

  function onClose() {
    modal.classList.add("modal--hidden");
    overlay.classList.add("overlay--hidden");
    $("#confirm-ok-btn").style.display = '';
    $("#confirm-cancel-btn").textContent = 'Cancel';
    $("#confirm-cancel-btn").removeEventListener("click", onClose);
  }
  $("#confirm-cancel-btn").addEventListener("click", onClose);
}

// ── Global State ──────────────────────────────────────────────────────────────
let allCompanies = [];
let allCandidates = [];
let allCategories = [];
let allSkills = [];
let currentCompany = null;
let currentCandidate = null;

// ── Section Navigation ────────────────────────────────────────────────────────
function initNav() {
  const links = $$(".sidebar__link");
  const sections = $$(".section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;

      // Activate link
      links.forEach(l => l.classList.remove("sidebar__link--active"));
      link.classList.add("sidebar__link--active");

      // Show section
      sections.forEach(s => s.classList.add("section--hidden"));
      $(`#section-${target}`)?.classList.remove("section--hidden");

      // Load data for section
      if (target === "companies") loadCompanies();
      if (target === "candidates") loadCandidates();
      if (target === "catalog") loadCatalog();
    });
  });

  // "View all" button on dashboard
  $("#seeAllCompaniesBtn")?.addEventListener("click", () => {
    $$(".sidebar__link").forEach(l => l.classList.remove("sidebar__link--active"));
    $('[data-section="companies"]')?.classList.add("sidebar__link--active");
    $$(".section").forEach(s => s.classList.add("section--hidden"));
    $("#section-companies")?.classList.remove("section--hidden");
    loadCompanies();
  });
}

// ── Overlay and Modals ────────────────────────────────────────────────────────
function openModal(modalId) {
  $(`#${modalId}`)?.classList.remove("modal--hidden");
  $("#overlay")?.classList.remove("overlay--hidden");
}

function closeModal(modalId) {
  $(`#${modalId}`)?.classList.add("modal--hidden");
  $("#overlay")?.classList.add("overlay--hidden");
}

function initModals() {
  // Close on overlay click
  $("#overlay")?.addEventListener("click", () => {
    ["modal-company", "modal-candidate", "modal-category", "modal-skill"]
      .forEach(id => closeModal(id));
  });

  // Company modal
  $("#closeCompanyModal")?.addEventListener("click", () => closeModal("modal-company"));
  $("#closeCompanyModal2")?.addEventListener("click", () => closeModal("modal-company"));

  // Candidate modal
  $("#closeCandidateModal")?.addEventListener("click", () => closeModal("modal-candidate"));
  $("#closeCandidateModal2")?.addEventListener("click", () => closeModal("modal-candidate"));

  // Category modal
  $("#openAddCategoryBtn")?.addEventListener("click", () => {
    $("#newCategoryName").value = "";
    $("#categoryError").hidden = true;
    openModal("modal-category");
  });
  $("#closeCategoryModal")?.addEventListener("click", () => closeModal("modal-category"));
  $("#closeCategoryModal2")?.addEventListener("click", () => closeModal("modal-category"));

  // Skill modal
  $("#openAddSkillBtn")?.addEventListener("click", () => {
    $("#newSkillName").value = "";
    $("#newSkillCategory").value = "";
    $("#skillError").hidden = true;
    openModal("modal-skill");
  });
  $("#closeSkillModal")?.addEventListener("click", () => closeModal("modal-skill"));
  $("#closeSkillModal2")?.addEventListener("click", () => closeModal("modal-skill"));
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await getDashboard();

    $("#stat-companies").textContent = data.stats.active_companies.toLocaleString();
    $("#stat-candidates").textContent = data.stats.total_candidates.toLocaleString();
    $("#stat-matches").textContent = data.stats.successful_matches.toLocaleString();

    renderLatestCompanies(data.latest_companies);
  } catch (err) {
    showError("Error loading dashboard: " + err.message);
  }
}

function renderLatestCompanies(companies) {
  const tbody = $("#latest-companies-body");
  if (!tbody) return;

  if (!companies?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No registered companies</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td><strong>${c.company_name || "Unnamed"}</strong></td>
      <td>${c.email}</td>
      <td>${c.location || "—"}</td>
      <td>${c.total_offers || 0}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Active" : "Suspended"}
      </span></td>
      <td>${formatDate(c.created_at)}</td>
    </tr>
  `).join("");
}

// ── COMPANIES ─────────────────────────────────────────────────────────────────
async function loadCompanies() {
  const tbody = $("#companies-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Loading...</td></tr>`;

  try {
    const search = $("#searchCompanies")?.value?.trim() || "";
    allCompanies = await getCompanies({ search });
    renderCompanies(allCompanies);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Error loading companies</td></tr>`;
  }
}

function sortCompanies(companies, criteria) {
  const sorted = [...companies];
  if (criteria === "name") sorted.sort((a, b) => (a.company_name || "").localeCompare(b.company_name || ""));
  if (criteria === "offers") sorted.sort((a, b) => (b.total_offers || 0) - (a.total_offers || 0));
  if (criteria === "recent") sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return sorted;
}

function renderCompanies(companies) {
  const tbody = $("#companies-body");
  if (!tbody) return;

  if (!companies?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No companies found</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td><strong>${c.company_name || "Unnamed"}</strong></td>
      <td>${c.email}</td>
      <td>${c.location || "—"}</td>
      <td>${c.total_offers || 0}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Active" : "Suspended"}
      </span></td>
      <td>
        <button class="btn--icon" title="View details" data-company-id="${c.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
      </td>
    </tr>
  `).join("");

  // Listen for detail button clicks
  tbody.querySelectorAll("[data-company-id]").forEach(btn => {
    btn.addEventListener("click", () => openCompanyModal(btn.dataset.companyId));
  });
}

async function openCompanyModal(companyId) {
  openModal("modal-company");
  const body = $("#modal-company-body");
  body.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500)">Loading company profile...</div>`;

  try {
    const c = await getCompanyById(companyId);
    currentCompany = c;

    $("#modal-company-name").textContent = c.company_name || "Unnamed";

    const websiteDisplay = c.website && c.website.length > 3
      ? `<a href="${c.website.startsWith('http') ? c.website : 'https://' + c.website}" target="_blank" style="color:var(--primary);text-decoration:none">${c.website}</a>`
      : "—";

    body.innerHTML = `
      <!-- Status Banner -->
      <div id="company-status-banner" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:8px;margin-bottom:16px;background:${c.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge ${c.is_active ? 'badge--active' : 'badge--inactive'}" style="font-size:13px;padding:4px 12px">
            ${c.is_active ? 'Active' : 'Suspended'}
          </span>
          <span style="font-size:13px;color:var(--gray-500)">since ${formatDate(c.created_at)}</span>
        </div>
        <button id="inline-toggle-btn" class="btn btn--sm ${c.is_active ? 'btn--danger' : 'btn--primary'}" style="font-size:12px;padding:6px 14px">
          ${c.is_active ? 'Suspend' : 'Activate'}
        </button>
      </div>

      <!-- Profile Info -->
      <div class="detail-grid" style="grid-template-columns:1fr 1fr;gap:12px 24px">
        <div class="detail-item">
          <p class="detail-item__label">Email</p>
          <p class="detail-item__value">${c.email}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Location</p>
          <p class="detail-item__value">${c.location || "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Website</p>
          <p class="detail-item__value">${websiteDisplay}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Total Offers</p>
          <p class="detail-item__value" style="font-weight:600;font-size:18px">${c.total_offers || 0}</p>
        </div>
      </div>

      ${c.description ? `
        <div style="margin-top:16px">
          <p class="detail-item__label">Description</p>
          <p style="color:var(--gray-600);font-size:14px;line-height:1.6;margin-top:4px">${c.description}</p>
        </div>
      ` : ''}

      ${c.offers?.length ? `
        <div style="margin-top:16px">
          <p class="detail-item__label" style="margin-bottom:8px">Job Offers (${c.offers.length})</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${c.offers.map(o => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--gray-50,#f9fafb);border-radius:6px;font-size:13px">
                <span style="font-weight:500">${o.title || 'Untitled'}</span>
                <span class="badge ${o.status === 'active' ? 'badge--active' : 'badge--inactive'}" style="font-size:11px">${o.status || '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Inline toggle button handler
    $("#inline-toggle-btn")?.addEventListener("click", () => handleToggleCompany());

    // Footer toggle button
    const toggleBtn = $("#modal-company-toggle-btn");
    toggleBtn.textContent = c.is_active ? "Suspend company" : "Activate company";
    toggleBtn.className = `btn ${c.is_active ? "btn--danger" : "btn--primary"}`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--red);text-align:center;padding:16px">Could not load company profile. Please try again.</p>`;
  }
}

async function handleToggleCompany() {
  if (!currentCompany) return;
  const action = currentCompany.is_active ? 'suspend' : 'activate';

  const confirmed = await showConfirm({
    title: `${currentCompany.is_active ? 'Suspend' : 'Activate'} Company`,
    message: `Are you sure you want to ${action} "${currentCompany.company_name || 'this company'}"?`,
    confirmText: currentCompany.is_active ? 'Suspend' : 'Activate',
    danger: currentCompany.is_active,
  });
  if (!confirmed) return;

  const toggleBtn = $("#inline-toggle-btn");
  const footerBtn = $("#modal-company-toggle-btn");
  if (toggleBtn) { toggleBtn.disabled = true; toggleBtn.textContent = 'Processing...'; }
  if (footerBtn) { footerBtn.disabled = true; }

  try {
    await toggleUserStatus(currentCompany.user_id, !currentCompany.is_active);
    closeModal("modal-company");
    loadCompanies();
    loadDashboard();
  } catch (err) {
    showNotification({ title: 'Action Failed', message: err.message || 'Could not change company status.', isError: true });
    if (toggleBtn) { toggleBtn.disabled = false; toggleBtn.textContent = currentCompany.is_active ? 'Suspend' : 'Activate'; }
    if (footerBtn) { footerBtn.disabled = false; }
  }
}

// ── CANDIDATES ────────────────────────────────────────────────────────────────
async function loadCandidates() {
  const tbody = $("#candidates-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Loading...</td></tr>`;

  try {
    const search = $("#searchCandidates")?.value?.trim() || "";
    allCandidates = await getCandidates({ search });
    renderCandidates(allCandidates);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Error loading candidates</td></tr>`;
  }
}

function sortCandidates(candidates, criteria) {
  const seniorityOrder = { senior: 3, mid: 2, junior: 1 };
  const sorted = [...candidates];
  if (criteria === "seniority") sorted.sort((a, b) =>
    (seniorityOrder[b.seniority] || 0) - (seniorityOrder[a.seniority] || 0));
  if (criteria === "experience") sorted.sort((a, b) =>
    (b.experience_years || 0) - (a.experience_years || 0));
  if (criteria === "recent") sorted.sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at));
  return sorted;
}

function renderCandidates(candidates) {
  const tbody = $("#candidates-body");
  if (!tbody) return;

  if (!candidates?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No candidates found</td></tr>`;
    return;
  }

  tbody.innerHTML = candidates.map(c => `
    <tr>
      <td>${c.email}</td>
      <td>${c.seniority || "—"}</td>
      <td>${c.experience_years != null ? `${c.experience_years} years` : "—"}</td>
      <td>${c.english_level || "—"}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Active" : "Suspended"}
      </span></td>
      <td>
        <button class="btn--icon" title="View details" data-candidate-id="${c.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-candidate-id]").forEach(btn => {
    btn.addEventListener("click", () => openCandidateModal(btn.dataset.candidateId));
  });
}

async function openCandidateModal(candidateId) {
  openModal("modal-candidate");
  const body = $("#modal-candidate-body");
  body.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500)">Loading candidate profile...</div>`;

  try {
    const c = await getCandidateById(candidateId);
    currentCandidate = c;

    const displayName = (c.first_name && c.last_name)
      ? `${c.first_name} ${c.last_name}`
      : c.email;
    $("#modal-candidate-email").textContent = displayName;

    const seniorityLabel = c.seniority
      ? c.seniority.charAt(0).toUpperCase() + c.seniority.slice(1)
      : "—";

    body.innerHTML = `
      <!-- Status Banner -->
      <div id="candidate-status-banner" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:8px;margin-bottom:16px;background:${c.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge ${c.is_active ? 'badge--active' : 'badge--inactive'}" style="font-size:13px;padding:4px 12px">
            ${c.is_active ? 'Active' : 'Suspended'}
          </span>
          <span style="font-size:13px;color:var(--gray-500)">since ${formatDate(c.created_at)}</span>
        </div>
        <button id="inline-candidate-toggle-btn" class="btn btn--sm ${c.is_active ? 'btn--danger' : 'btn--primary'}" style="font-size:12px;padding:6px 14px">
          ${c.is_active ? 'Suspend' : 'Activate'}
        </button>
      </div>

      <!-- Profile Info -->
      <div class="detail-grid" style="grid-template-columns:1fr 1fr;gap:12px 24px">
        <div class="detail-item">
          <p class="detail-item__label">Email</p>
          <p class="detail-item__value">${c.email}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Seniority</p>
          <p class="detail-item__value">${seniorityLabel}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Experience</p>
          <p class="detail-item__value" style="font-weight:600;font-size:18px">${c.experience_years != null ? `${c.experience_years} years` : "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">English Level</p>
          <p class="detail-item__value">${c.english_level || "—"}</p>
        </div>
      </div>

      ${c.categories?.length ? `
        <div style="margin-top:16px">
          <p class="detail-item__label" style="margin-bottom:8px">Categories</p>
          <div class="tags">
            ${c.categories.map(cat => `<span class="tag">${cat.name}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      ${c.skills?.length ? `
        <div style="margin-top:12px">
          <p class="detail-item__label" style="margin-bottom:8px">Skills</p>
          <div class="tags">
            ${c.skills.map(s => `<span class="tag">${s.name}${s.level ? ` (${s.level}/5)` : ''}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    `;

    // Inline toggle button handler
    $("#inline-candidate-toggle-btn")?.addEventListener("click", () => handleToggleCandidate());

    // Footer toggle button
    const toggleBtn = $("#modal-candidate-toggle-btn");
    toggleBtn.textContent = c.is_active ? "Suspend candidate" : "Activate candidate";
    toggleBtn.className = `btn ${c.is_active ? "btn--danger" : "btn--primary"}`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--red);text-align:center;padding:16px">Could not load candidate profile. Please try again.</p>`;
  }
}

async function handleToggleCandidate() {
  if (!currentCandidate) return;
  const action = currentCandidate.is_active ? 'suspend' : 'activate';
  const displayName = (currentCandidate.first_name && currentCandidate.last_name)
    ? `${currentCandidate.first_name} ${currentCandidate.last_name}`
    : currentCandidate.email;

  const confirmed = await showConfirm({
    title: `${currentCandidate.is_active ? 'Suspend' : 'Activate'} Candidate`,
    message: `Are you sure you want to ${action} "${displayName}"?`,
    confirmText: currentCandidate.is_active ? 'Suspend' : 'Activate',
    danger: currentCandidate.is_active,
  });
  if (!confirmed) return;

  const toggleBtn = $("#inline-candidate-toggle-btn");
  const footerBtn = $("#modal-candidate-toggle-btn");
  if (toggleBtn) { toggleBtn.disabled = true; toggleBtn.textContent = 'Processing...'; }
  if (footerBtn) { footerBtn.disabled = true; }

  try {
    await toggleUserStatus(currentCandidate.user_id, !currentCandidate.is_active);
    closeModal("modal-candidate");
    loadCandidates();
  } catch (err) {
    showNotification({ title: 'Action Failed', message: err.message || 'Could not change candidate status.', isError: true });
    if (toggleBtn) { toggleBtn.disabled = false; toggleBtn.textContent = currentCandidate.is_active ? 'Suspend' : 'Activate'; }
    if (footerBtn) { footerBtn.disabled = false; }
  }
}

// ── SUSPEND / ACTIVATE ────────────────────────────────────────────────────────
function initToggleStatus() {
  $("#modal-company-toggle-btn")?.addEventListener("click", () => handleToggleCompany());
  $("#modal-candidate-toggle-btn")?.addEventListener("click", () => handleToggleCandidate());
}

// ── CATALOG ───────────────────────────────────────────────────────────────────
async function loadCatalog() {
  try {
    allCategories = await getCategories();
    allSkills = await getAllSkills();

    renderCategories();
    renderSkills();
    populateCategorySelects();
  } catch (err) {
    showError("Error loading catalog: " + err.message);
  }
}

function renderCategories() {
  const list = $("#categories-list");
  if (!list) return;

  if (!allCategories.length) {
    list.innerHTML = `<li class="table__empty">No categories found</li>`;
    return;
  }

  list.innerHTML = allCategories.map(cat => `
    <li>
      <span class="catalog-list__name">${cat.name}</span>
      <button class="btn--icon" data-delete-category="${cat.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    </li>
  `).join("");

  list.querySelectorAll("[data-delete-category]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const catName = btn.closest("li").querySelector(".catalog-list__name").textContent;
      const confirmed = await showConfirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${catName}"? This will also remove associated skills.`,
        confirmText: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
      try {
        await deleteCategory(btn.dataset.deleteCategory);
        loadCatalog();
      } catch (err) {
        showNotification({ title: 'Delete Failed', message: err.message || 'Could not delete category.', isError: true });
      }
    });
  });
}

function renderSkills(filteredCategoryId = "") {
  const list = $("#skills-list");
  if (!list) return;

  const filtered = filteredCategoryId
    ? allSkills.filter(s => s.category_id === filteredCategoryId)
    : allSkills;

  if (!filtered.length) {
    list.innerHTML = `<li class="table__empty">No skills found</li>`;
    return;
  }

  list.innerHTML = filtered.map(s => `
    <li>
      <div>
        <span class="catalog-list__name">${s.name}</span>
        <span class="catalog-list__cat">${s.category}</span>
      </div>
      <button class="btn--icon" data-delete-skill="${s.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    </li>
  `).join("");

  list.querySelectorAll("[data-delete-skill]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const confirmed = await showConfirm({
        title: 'Delete Skill',
        message: 'Are you sure you want to delete this skill?',
        confirmText: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
      try {
        await deleteSkill(btn.dataset.deleteSkill);
        loadCatalog();
      } catch (err) {
        showNotification({ title: 'Delete Failed', message: err.message || 'Could not delete skill.', isError: true });
      }
    });
  });
}

function populateCategorySelects() {
  // Skills filter select
  const filterSelect = $("#filterSkillsByCategory");
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="">All categories</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }

  // New skill modal select
  const skillCatSelect = $("#newSkillCategory");
  if (skillCatSelect) {
    skillCatSelect.innerHTML = `<option value="">Select a category</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }
}

function initCatalogEvents() {
  // Filter skills by category
  $("#filterSkillsByCategory")?.addEventListener("change", (e) => {
    renderSkills(e.target.value);
  });

  // Save new category
  $("#saveCategoryBtn")?.addEventListener("click", async () => {
    const name = $("#newCategoryName")?.value?.trim();
    const errorEl = $("#categoryError");

    if (!name) {
      errorEl.textContent = "Name is required";
      errorEl.hidden = false;
      return;
    }

    try {
      await createCategory(name);
      closeModal("modal-category");
      loadCatalog();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  // Save new skill
  $("#saveSkillBtn")?.addEventListener("click", async () => {
    const name = $("#newSkillName")?.value?.trim();
    const category_id = $("#newSkillCategory")?.value;
    const errorEl = $("#skillError");

    if (!name || !category_id) {
      errorEl.textContent = "All fields are required";
      errorEl.hidden = false;
      return;
    }

    try {
      await createSkill(name, category_id);
      closeModal("modal-skill");
      loadCatalog();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

// ── SEARCH AND SORT ───────────────────────────────────────────────────────────
function initSearchAndSort() {
  let searchTimeout;

  $("#searchCompanies")?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadCompanies(), 400);
  });

  $("#sortCompanies")?.addEventListener("change", (e) => {
    renderCompanies(sortCompanies(allCompanies, e.target.value));
  });

  $("#searchCandidates")?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadCandidates(), 400);
  });

  $("#sortCandidates")?.addEventListener("change", (e) => {
    renderCandidates(sortCandidates(allCandidates, e.target.value));
  });
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function initLogout() {
  $("#logoutBtn")?.addEventListener("click", async () => {
    await authLogout();
    window.location.href = "/public/login.html";
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const me = await authMe();

  if (!me.authenticated || me.user?.role !== "admin") {
    window.location.href = "/public/login.html";
    return;
  }

  initNav();
  initModals();
  initToggleStatus();
  initCatalogEvents();
  initSearchAndSort();
  initLogout();
  loadDashboard();
});