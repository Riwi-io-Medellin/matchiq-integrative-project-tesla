import { apiFetch } from "./apiClient.js";

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboard() {
  return apiFetch("/admin/dashboard", { method: "GET" });
}

// ── Empresas ──────────────────────────────────────────────────────────────────
export async function getCompanies({ search } = {}) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/admin/companies${query}`, { method: "GET" });
}

export async function getCompanyById(id) {
  return apiFetch(`/admin/companies/${id}`, { method: "GET" });
}

// ── Candidatos ────────────────────────────────────────────────────────────────
export async function getCandidates({ search } = {}) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/admin/candidates${query}`, { method: "GET" });
}

export async function getCandidateById(id) {
  return apiFetch(`/admin/candidates/${id}`, { method: "GET" });
}

// ── Suspender / activar ───────────────────────────────────────────────────────
export async function toggleUserStatus(userId, is_active) {
  return apiFetch(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
export async function getCategories() {
  return apiFetch("/catalog/categories", { method: "GET" });
}

export async function getSkillsByCategory(categoryId) {
  return apiFetch(`/catalog/categories/${categoryId}/skills`, { method: "GET" });
}

export async function getAllSkills() {
  return apiFetch("/catalog/skills", { method: "GET" });
}

export async function createCategory(name) {
  return apiFetch("/catalog/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function createSkill(name, category_id) {
  return apiFetch("/catalog/skills", {
    method: "POST",
    body: JSON.stringify({ name, category_id }),
  });
}

export async function deleteCategory(id) {
  return apiFetch(`/catalog/categories/${id}`, { method: "DELETE" });
}

export async function deleteSkill(id) {
  return apiFetch(`/catalog/skills/${id}`, { method: "DELETE" });
}