import { apiFetch } from "./apiClient.js";

// ── Perfil de empresa ─────────────────────────────────────────────────────────
export async function getCompanyProfile() {
  const data = await apiFetch("/company/profile", { method: "GET" });
  return data.profile;
}

export async function updateCompanyProfile({ company_name, description, website, location }) {
  return apiFetch("/company/profile", {
    method: "PUT",
    body: JSON.stringify({ company_name, description, website, location }),
  });
}
