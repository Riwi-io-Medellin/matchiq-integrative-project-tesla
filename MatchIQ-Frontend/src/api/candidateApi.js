import { apiFetch } from "./apiClient.js";

// ── Perfil ────────────────────────────────────────────────────────────────────
export async function getCandidateProfile() {
  return apiFetch("/candidate/profile", { method: "GET" });
}

export async function updateCandidateProfile({ first_name, last_name, experience_years, seniority, english_level, github_link }) {
  return apiFetch("/candidate/profile", {
    method: "PATCH",
    body: JSON.stringify({ first_name, last_name, experience_years, seniority, english_level, github_link }),
  });
}

// ── Categorías ────────────────────────────────────────────────────────────────
export async function updateCandidateCategories(category_ids) {
  return apiFetch("/candidate/categories", {
    method: "PUT",
    body: JSON.stringify({ category_ids }),
  });
}

// ── Skills ────────────────────────────────────────────────────────────────────
export async function updateCandidateSkills(skills) {
  return apiFetch("/candidate/skills", {
    method: "PUT",
    body: JSON.stringify({ skills }),
  });
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
export async function getCategories() {
  return apiFetch("/catalog/categories", { method: "GET" });
}

export async function getSkillsByCategory(categoryId) {
  return apiFetch(`/catalog/categories/${categoryId}/skills`, { method: "GET" });
}