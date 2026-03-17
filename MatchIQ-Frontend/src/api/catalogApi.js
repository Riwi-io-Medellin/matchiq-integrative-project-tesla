// ── Catalog API ─────────────────────────────────────────────────
// Categorías y skills del catálogo (backend).

import { apiFetch } from './apiClient.js';

/**
 * Obtener todas las categorías.
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getCategories() {
    return apiFetch('/catalog/categories');
}

/**
 * Obtener skills de una categoría por su ID.
 * @param {string} categoryId - UUID de la categoría
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getSkillsByCategory(categoryId) {
    return apiFetch(`/catalog/categories/${categoryId}/skills`);
}
