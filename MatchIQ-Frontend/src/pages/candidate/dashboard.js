import { authMe } from "../../api/authApi.js";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateCandidateCategories,
  updateCandidateSkills,
  getCategories,
  getSkillsByCategory,
} from "../../api/candidateApi.js";
import { getMyInvitations } from "../../api/testsApi.js";

const $ = (sel) => document.querySelector(sel);

// ── Global state ─────────────────────────────────────────────────────────────────────
const state = {
  user: null,
  profile: null,
  categories: [],
  allSkills: [],
  selectedCategories: [],
  selectedSkills: [],
};

// ── Utilities ────────────────────────────────────────────────────────────────
function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.className = `alert${type === "error" ? " is-error" : ""}`;
}

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const checks = [
    !!profile.first_name,
    !!profile.last_name,
    Array.isArray(profile.categories) && profile.categories.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    profile.experience_years != null,
    !!profile.english_level,
    !!profile.seniority,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function isProfileComplete(profile) {
  return (
    !!profile.first_name &&
    !!profile.last_name &&
    profile.categories?.length > 0 &&
    profile.skills?.length > 0
  );
}



// ── Render dashboard stats ────────────────────────────────────────────────────
function renderDashboard(profile) {
  $("#welcomeText").textContent = `Hello, ${profile.first_name || "Candidate"}`;

  const completeness = calculateCompleteness(profile);
  $("#profileCompletenessValue").textContent = `${completeness}%`;
}

// ── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en");
}

// ── Render Pending Tests ──────────────────────────────────────────────────────
function renderPendingTests(assignments) {
  const pending = assignments.filter(a => a.status === "pending");
  const completed = assignments.filter(a => a.status === "completed");

  // Update stat cards
  $("#pendingTestsValue").textContent = pending.length;
  $("#completedTestsValue").textContent = completed.length;

  // Hide loader
  const loader = $("#pendingTestsLoader");
  if (loader) loader.style.display = "none";

  if (!pending.length) {
    const empty = $("#pendingTestsEmpty");
    if (empty) empty.style.display = "";
    const container = $("#pendingTestCards");
    if (container) container.style.display = "none";
    return;
  }

  const container = $("#pendingTestCards");
  if (!container) return;
  container.style.display = "";

  container.innerHTML = pending.map(t => {
    const title = t.offer_title || t.offerTitle || "Technical test";
    const company = t.company_name || t.companyName || "Company";
    const dateVal = t.assigned_at || t.created_at || t.sentAt;
    return `
    <a class="test-card" href="#/tests">
      <div class="test-card__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
      </div>
      <div class="test-card__body">
        <strong class="test-card__title">${title}</strong>
        <span class="test-card__meta">${company} · ${dateVal ? timeAgo(dateVal) : 'Recently'}</span>
      </div>
      <span class="test-card__badge test-card__badge--pending">Pending</span>
    </a>
  `;}).join("");
}

// ── Render Activity Feed ──────────────────────────────────────────────────────
function renderActivityFeed(assignments) {
  const loader = $("#activityLoader");
  if (loader) loader.style.display = "none";

  if (!assignments.length) {
    const empty = $("#activityEmpty");
    if (empty) empty.style.display = "";
    return;
  }

  const feed = $("#activityFeed");
  if (!feed) return;
  feed.style.display = "";

  // Helper to get the most relevant date for sorting
  const getDate = (t) => t.completed_at || t.assigned_at || t.created_at || t.sentAt || "";

  // Sort by date descending, take last 10
  const sorted = [...assignments].sort((a, b) => new Date(getDate(b)) - new Date(getDate(a))).slice(0, 10);

  feed.innerHTML = sorted.map(t => {
    const isCompleted = t.status === "completed";
    const title = t.offer_title || t.offerTitle || "an offer";
    const company = t.company_name || t.companyName || "A company";
    const icon = isCompleted
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    const statusClass = isCompleted ? "activity-item--completed" : "activity-item--pending";
    const dateStr = getDate(t);
    const message = isCompleted
      ? `You completed the test from <strong>${company}</strong> for <strong>${title}</strong>`
      : `<strong>${company}</strong> sent you a test for <strong>${title}</strong>`;

    return `
      <div class="activity-item ${statusClass}">
        <div class="activity-item__icon">${icon}</div>
        <div class="activity-item__body">
          <p class="activity-item__text">${message}</p>
          <span class="activity-item__time">${dateStr ? timeAgo(dateStr) : 'Recently'}</span>
        </div>
      </div>
    `;
  }).join("");
}

// ── Catalog ────────────────────────────────────────────────────────────────────────
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

// ── Category picker (onboarding) ─────────────────────────────────────────────────
function renderCategoriesPicker(containerId) {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.innerHTML = "";

  const skillsPickerId = containerId === "ob-categoriesPicker" ? "ob-skillsPicker" : "skillsPicker";
  const counterPickerId = containerId === "ob-categoriesPicker" ? "ob-skillsCounter" : "skillsCounter";

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
        state.selectedSkills = state.selectedSkills.filter((s) => s.category_id !== cat.id);
      }
      const categoryIds = state.selectedCategories.map((c) => c.id);
      state.allSkills = await loadSkillsForCategories(categoryIds);
      renderSkillsPicker(skillsPickerId);
      updateSkillsCounter(counterPickerId);
    });

    container.appendChild(label);
  });
}

// ── Picker de skills (onboarding) ─────────────────────────────────────────────
function renderSkillsPicker(containerId) {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.innerHTML = "";

  const counterPickerId = containerId === "ob-skillsPicker" ? "ob-skillsCounter" : "skillsCounter";

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
      updateSkillsCounter(counterPickerId);
    });

    container.appendChild(label);
  });
}

function updateSkillsCounter(counterId) {
  const counter = $(`#${counterId}`);
  if (!counter) return;
  const total = state.selectedSkills.length;
  counter.textContent = `${total} skill${total !== 1 ? "s" : ""} selected`;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function showOnboarding() {
  $("#onboardingOverlay").classList.remove("onboarding--hidden");
}

function hideOnboarding() {
  $("#onboardingOverlay").classList.add("onboarding--hidden");
}

function initOnboarding() {
  const overlay = document.getElementById('onboardingOverlay');
  if (!overlay) return;

  const card = overlay.querySelector('.onboarding-card');
  if (!card) return;

  function goToStep(index) {
    const allSteps = card.querySelectorAll('[id^="ob-step-"]');
    allSteps.forEach((el, i) => {
      if (i === index) {
        el.style.display = '';
        el.classList.remove("ob-step--hidden");
      } else {
        el.style.display = 'none';
        el.classList.add("ob-step--hidden");
      }
    });
    const percentages = ["33%", "66%", "100%"];
    const bar = overlay.querySelector("#ob-progressBar");
    if (bar) bar.style.width = percentages[index] || "100%";
  }

  goToStep(0);

  const continueBtn = card.querySelector("#ob_nextStep1");
  if (!continueBtn) return;

  // Step 1 → 2
  continueBtn.addEventListener("click", async () => {
    const alertEl = card.querySelector("#onboardingAlert");
    const btn = continueBtn;
    const first_name = card.querySelector("#ob_firstName")?.value.trim();
    const last_name = card.querySelector("#ob_lastName")?.value.trim();
    const experience_years = Number(card.querySelector("#ob_experience")?.value || 0);
    const english_level = card.querySelector("#ob_english")?.value;
    const seniority = card.querySelector("#ob_seniority")?.value;
    const github_link = card.querySelector("#ob_github")?.value.trim();

    if (!first_name || !last_name) {
      setAlert(alertEl, "Please enter your first and last name.", "error");
      return;
    }

    if (!seniority) {
      setAlert(alertEl, "Please select your seniority level.", "error");
      return;
    }

    if (!english_level) {
      setAlert(alertEl, "Please select your English level.", "error");
      return;
    }

    // Save step 1 data to state for later use
    state.onboardingStep1 = { first_name, last_name, experience_years, english_level, seniority, github_link };

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> Loading...`;

    setAlert(alertEl, "");

    // Ensure categories are loaded
    if (!state.categories || state.categories.length === 0) {
      try {
        state.categories = await getCategories();
      } catch (e) {
        console.error("Failed to load categories:", e);
        setAlert(alertEl, "Could not load categories. Please try again.", "error");
        btn.disabled = false;
        btn.textContent = "Continue";
        return;
      }
    }

    goToStep(1);
    state.selectedCategories = [];
    state.selectedSkills = [];
    state.allSkills = [];
    renderCategoriesPicker("ob-categoriesPicker");

    // Restore button
    btn.disabled = false;
    btn.textContent = "Continue";
  });

  // Step 2 → 3
  card.querySelector("#ob_nextStep2")?.addEventListener("click", async () => {
    const alertEl = card.querySelector("#onboardingAlert");

    if (!state.selectedCategories.length) {
      setAlert(alertEl, "Please select at least one category to continue.", "error");
      return;
    }

    setAlert(alertEl, "");
    goToStep(2);

    state.allSkills = await loadSkillsForCategories(state.selectedCategories.map((c) => c.id));
    renderSkillsPicker("ob-skillsPicker");
    updateSkillsCounter("ob-skillsCounter");
  });

  // Step 3 → save
  card.querySelector("#ob_saveBtn")?.addEventListener("click", async () => {
    const alertEl = card.querySelector("#onboardingAlert");

    if (!state.selectedSkills.length) {
      setAlert(alertEl, "Please select at least one skill to continue.", "error");
      return;
    }

    // Read step 1 data from state (not DOM, since step 1 may be hidden)
    const { first_name, last_name, experience_years, english_level, seniority, github_link } = state.onboardingStep1 || {};

    if (!first_name || !last_name || !seniority) {
      setAlert(alertEl, "Missing profile data. Please go back and fill all fields.", "error");
      return;
    }

    try {
      await updateCandidateProfile({ first_name, last_name, experience_years, english_level, seniority, github_link });
      await updateCandidateCategories(state.selectedCategories.map((c) => c.id));
      await updateCandidateSkills(state.selectedSkills.map((s) => ({ skill_id: s.skill_id, level: s.level })));

      state.profile = await getCandidateProfile();
      renderDashboard(state.profile);
      hideOnboarding();
    } catch (err) {
      setAlert(alertEl, err.message || "Something went wrong while saving your profile. Please try again.", "error");
    }
  });

  // Clear skills in onboarding
  card.querySelector("#ob-clearSkillsBtn")?.addEventListener("click", () => {
    state.selectedSkills = [];
    renderSkillsPicker("ob-skillsPicker");
    updateSkillsCounter("ob-skillsCounter");
  });

  // Back buttons
  card.querySelector("#ob_backStep2")?.addEventListener("click", () => {
    setAlert(card.querySelector("#onboardingAlert"), "");
    goToStep(0);
  });

  card.querySelector("#ob_backStep3")?.addEventListener("click", () => {
    setAlert(card.querySelector("#onboardingAlert"), "");
    goToStep(1);
  });
}



// ── INIT ──────────────────────────────────────────────────────────────────────
export async function initDashboard() {
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

  // Load categories (always needed for onboarding/profile edit)
  try {
    state.categories = await getCategories();
  } catch (err) {
    console.error("Error loading categories:", err);
    state.categories = [];
  }

  // Load profile (may fail for new users)
  try {
    state.profile = await getCandidateProfile();
    renderDashboard(state.profile);
  } catch (err) {
    console.error("Error loading profile:", err);
    state.profile = {};
  }

  if (!state.profile || !isProfileComplete(state.profile)) {
    initOnboarding();
    showOnboarding();
  }

  // Fetch test assignments
  try {
    const assignments = await getMyInvitations();
    renderPendingTests(assignments);
    renderActivityFeed(assignments);
  } catch (err) {
    console.error("Error loading tests:", err);
    const loader1 = $("#pendingTestsLoader");
    const loader2 = $("#activityLoader");
    if (loader1) loader1.style.display = "none";
    if (loader2) loader2.style.display = "none";
    $("#pendingTestsValue").textContent = "—";
    $("#completedTestsValue").textContent = "—";
  }
}
