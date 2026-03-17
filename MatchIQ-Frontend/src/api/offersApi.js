// ── Offers API ──────────────────────────────────────────────────────
// CRUD de ofertas laborales.

import { apiFetch } from './apiClient.js';

/* ── API Pública ───────────────────────────────────────────────── */

/**
 * Obtener todas las ofertas de la empresa.
 * @returns {Promise<Array>}
 */
export async function getOffers() {
    return apiFetch('/offers');
}

/**
 * Obtener una oferta por su ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getOfferById(id) {
    return apiFetch(`/offers/${id}`).catch(() => null);
}

/**
 * Crear una nueva oferta.
 * @param {object} data - Datos de la oferta
 * @returns {Promise<object>} - Oferta creada
 */
export async function createOffer(data) {
    return apiFetch('/offers', { method: 'POST', body: JSON.stringify(data) });
}

/**
 * Actualizar una oferta existente.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateOffer(id, data) {
    return apiFetch(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/**
 * Cerrar una oferta (status → closed).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function closeOffer(id) {
    return apiFetch(`/offers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed' })
    });
}

/**
 * Cancelar una oferta (status → cancelled).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function cancelOffer(id) {
    return apiFetch(`/offers/${id}/force-cancel`, {
        method: 'PATCH'
    });
}
