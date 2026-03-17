// ── Candidate Profile Page ─────────────────────────────────────
// Shows profile info in view mode, and toggles inline edit form.

import { authMe } from "../../api/authApi.js";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateCandidateCategories,
  updateCandidateSkills,
  getCategories,
  getSkillsByCategory,
} from "../../api/candidateApi.js";

const $ = (sel) => document.querySelector(sel);

// ── State ────────────────────────────────────────────────────────
const state = {
  user: null,
  profile: null,
  categories: [],
  allSkills: [],
  selectedCategories: [],
  selectedSkills: [],
};

// ── Utilities ────────────────────────────────────────────────────
function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.className = `alert${type === "error" ? " is-error" : ""}`;
}

function renderTags(container, values = []) {
  if (!container) return;
  container.innerHTML = "";
  if (!values.length) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = "Not defined";
    container.appendChild(span);
    return;
  }
  values.forEach((v) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = v;
    container.appendChild(span);
  });
}


// ── Render Profile View ──────────────────────────────────────────
function renderProfile(profile) {
  const welcomeEl = $("#welcomeText");
  if (welcomeEl) welcomeEl.textContent = `Hello, ${profile.first_name || "Candidate"}`;
  $("#firstNameValue").textContent = profile.first_name || "-";
  $("#lastNameValue").textContent = profile.last_name || "-";
  $("#experienceValue").textContent = profile.experience_years != null ? `${profile.experience_years} years` : "-";
  $("#englishValue").textContent = profile.english_level || "-";
  const seniority = profile.seniority;
  $("#seniorityValue").textContent = seniority ? seniority.charAt(0).toUpperCase() + seniority.slice(1) : "-";

  const githubEl = $("#githubValue");
  if (githubEl) {
    if (profile.github_link) {
      githubEl.innerHTML = `<a href="${profile.github_link}" target="_blank" rel="noopener noreferrer">${profile.github_link}</a>`;
    } else {
      githubEl.textContent = "-";
    }
  }

  renderTags($("#categoriesTags"), (profile.categories || []).map((c) => c.name));
  renderTags($("#skillsTags"), (profile.skills || []).map((s) => s.name));
}

// ── Catalog helpers ──────────────────────────────────────────────
async function loadSkillsForCategories(categoryIds) {
  const skillsMap = {};
  await Promise.all(
    categoryIds.map(async (id) => {
      const skills = await getSkillsByCategory(id);
      skills.forEach((s) => { skillsMap[s.id] = s; });
    })
  );
  return Object.values(skillsMap);
}

// ── Category Picker ──────────────────────────────────────────────
function renderCategoriesPicker() {
  const container = $("#categoriesPicker");
  if (!container) return;
  container.innerHTML = "";

  state.categories.forEach((cat) => {
    const isSelected = state.selectedCategories.some((c) => c.id === cat.id);
    const label = document.createElement("label");
    label.className = `picker-card${isSelected ? " is-selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${isSelected ? "checked" : ""} />
      <span class="picker-card__check" aria-hidden="true"></span>
      <span class="picker-card__text">
        <span class="picker-card__title">${cat.name}</span>
      </span>
    `;

    const input = label.querySelector("input");
    input.addEventListener("change", async () => {
      label.classList.toggle("is-selected", input.checked);
      if (input.checked) {
        if (!state.selectedCategories.some((c) => c.id === cat.id)) {
          state.selectedCategories.push({ id: cat.id, name: cat.name });
        }
      } else {
        state.selectedCategories = state.selectedCategories.filter((c) => c.id !== cat.id);
      }
      const categoryIds = state.selectedCategories.map((c) => c.id);
      state.allSkills = categoryIds.length ? await loadSkillsForCategories(categoryIds) : [];
      // Keep only skills that belong to the current available skills
      const validSkillIds = new Set(state.allSkills.map((s) => s.id));
      state.selectedSkills = state.selectedSkills.filter((s) => validSkillIds.has(s.skill_id));
      renderSkillsPicker();
      updateSkillsCounter();
    });

    container.appendChild(label);
  });
}

// ── Skills Picker ────────────────────────────────────────────────
function renderSkillsPicker() {
  const container = $("#skillsPicker");
  if (!container) return;
  container.innerHTML = "";

  if (!state.allSkills.length) {
    const empty = document.createElement("div");
    empty.className = "picker-empty";
    empty.textContent = "Select at least one category to see its skills.";
    container.appendChild(empty);
    return;
  }

  state.allSkills.forEach((skill) => {
    const existing = state.selectedSkills.find((s) => s.skill_id === skill.id);
    const isSelected = !!existing;

    const label = document.createElement("label");
    label.className = `picker-card${isSelected ? " is-selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${isSelected ? "checked" : ""} />
      <span class="picker-card__check" aria-hidden="true"></span>
      <span class="picker-card__text">
        <span class="picker-card__title">${skill.name}</span>
        <span class="picker-card__meta">${skill.category || ""}</span>
      </span>
    `;

    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      label.classList.toggle("is-selected", input.checked);
      if (input.checked) {
        if (!state.selectedSkills.some((s) => s.skill_id === skill.id)) {
          state.selectedSkills.push({
            skill_id: skill.id,
            name: skill.name,
            level: 3,
            category_id: skill.category_id,
          });
        }
      } else {
        state.selectedSkills = state.selectedSkills.filter((s) => s.skill_id !== skill.id);
      }
      updateSkillsCounter();
    });

    container.appendChild(label);
  });
}

function updateSkillsCounter() {
  const counter = $("#skillsCounter");
  if (!counter) return;
  const total = state.selectedSkills.length;
  counter.textContent = `${total} skill${total !== 1 ? "s" : ""} selected`;
}

// ── Fill form with current profile data ──────────────────────────
async function fillProfileForm() {
  const profile = state.profile;

  $("#firstNameInput").value = profile.first_name || "";
  $("#lastNameInput").value = profile.last_name || "";
  $("#experienceInput").value = profile.experience_years ?? "";
  $("#englishInput").value = profile.english_level || "";
  $("#seniorityInput").value = profile.seniority || "";
  $("#githubInput").value = profile.github_link || "";

  state.selectedCategories = (profile.categories || []).map((c) => ({ id: c.id, name: c.name }));

  const categoryIds = state.selectedCategories.map((c) => c.id);
  state.allSkills = categoryIds.length ? await loadSkillsForCategories(categoryIds) : [];

  // Only keep skills that belong to the currently selected categories
  const validSkillIds = new Set(state.allSkills.map((s) => s.id));
  state.selectedSkills = (profile.skills || [])
    .filter((s) => validSkillIds.has(s.id))
    .map((s) => ({
      skill_id: s.id,
      name: s.name,
      level: s.level || 3,
      category_id: s.category_id,
    }));

  renderCategoriesPicker();
  renderSkillsPicker();
  updateSkillsCounter();
}

// ── Save Profile ─────────────────────────────────────────────────
async function saveProfile() {
  const alertEl = $("#profileFormAlert");
  setAlert(alertEl, "");

  const first_name = $("#firstNameInput")?.value.trim();
  const last_name = $("#lastNameInput")?.value.trim();
  const experience_years = Number($("#experienceInput")?.value);
  const english_level = $("#englishInput")?.value;
  const seniority = $("#seniorityInput")?.value;
  const github_link = $("#githubInput")?.value.trim();

  if (!first_name || !last_name) {
    setAlert(alertEl, "Please enter your first and last name.", "error");
    return false;
  }

  if (!state.selectedCategories.length) {
    setAlert(alertEl, "Please select at least one category to continue.", "error");
    return false;
  }

  if (!state.selectedSkills.length) {
    setAlert(alertEl, "Please select at least one skill to continue.", "error");
    return false;
  }

  try {
    await updateCandidateProfile({ first_name, last_name, experience_years, english_level, seniority, github_link });
    await updateCandidateCategories(state.selectedCategories.map((c) => c.id));
    await updateCandidateSkills(state.selectedSkills.map((s) => ({ skill_id: s.skill_id, level: s.level })));

    state.profile = await getCandidateProfile();
    renderProfile(state.profile);
    return true;
  } catch (err) {
    setAlert(alertEl, err.message || "Something went wrong while saving your profile. Please try again.", "error");
    return false;
  }
}

// ── View / Edit Toggle ───────────────────────────────────────────
function showEditForm() {
  $("#profileViewSection").style.display = "none";
  $("#profileEditSection").style.display = "";
  fillProfileForm();
}

function showViewMode() {
  $("#profileEditSection").style.display = "none";
  $("#profileViewSection").style.display = "";
}

// ── INIT ───────────────────────────────────────────────────────────
export async function initProfile() {
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

  try {
    const [profile, categories] = await Promise.all([
      getCandidateProfile(),
      getCategories(),
    ]);

    state.profile = profile;
    state.categories = categories;

    // Filter skills to only show those belonging to selected categories
    const profileCategoryIds = (profile.categories || []).map((c) => c.id);
    if (profileCategoryIds.length) {
      const validSkills = await loadSkillsForCategories(profileCategoryIds);
      const validSkillIds = new Set(validSkills.map((s) => s.id));
      profile.skills = (profile.skills || []).filter((s) => validSkillIds.has(s.id));
    } else {
      profile.skills = [];
    }

    renderProfile(profile);
  } catch (err) {
    console.error("Error loading profile:", err);
    setAlert($("#profileAlert"), "We couldn't load your profile. Please refresh the page and try again.", "error");
  }

  // Edit profile toggle
  $("#editProfileBtn")?.addEventListener("click", showEditForm);
  $("#cancelProfileBtn")?.addEventListener("click", showViewMode);

  // Clear skills
  $("#clearSkillsBtn")?.addEventListener("click", () => {
    state.selectedSkills = [];
    renderSkillsPicker();
    updateSkillsCounter();
  });

  // Save profile form
  $("#profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = $("#saveProfileBtn");
    saveBtn?.classList.add("btn--loading");
    const ok = await saveProfile();
    saveBtn?.classList.remove("btn--loading");
    if (ok) showViewMode();
  });
}
