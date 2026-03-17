// ── Dashboard View Logic ────────────────────────────────────────
// Renderiza KPIs y tabla de ofertas recientes.

import { getOffers } from '../../api/offersApi.js';
import { showOfferModal } from './app.js';

const MODALITY_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };

const STATUS_PILLS = {
    open: '<span class="pill pill--active">Open</span>',
    active: '<span class="pill pill--active">Active</span>',
    in_process: '<span class="pill pill--in-process">In Process</span>',
    closed: '<span class="pill pill--closed">Closed</span>',
    cancelled: '<span class="pill pill--closed">Closed</span>',
};

function isActiveOffer(offer) {
    return offer.status === 'active' || offer.status === 'open';
}

/**
 * Inicializa la vista del Dashboard.
 */
export async function initDashboard() {
    const container = document.getElementById('app') || document.querySelector('.main');

    // Show loader
    const loader = container?.querySelector('.page-loader');
    const offers = await getOffers();
    if (loader) loader.remove();

    const active = offers.filter(o => isActiveOffer(o)).length;
    const closed = offers.filter(o => o.status === 'closed').length;
    const total = offers.length;

    // KPIs
    setText('kpi-active', active);
    setText('kpi-total', total);
    setText('kpi-closed', closed);

    // Tabla — últimas 5 ofertas
    const tbody = document.getElementById('dashboard-table-body');
    if (!tbody) return;

    const recent = offers.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:40px; color: var(--text-600);">
                    No offers yet. <a href="#/offers/create" class="link">Create your first offer →</a>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = recent.map(o => `
        <tr class="offer-row" data-id="${o.id}" style="cursor: pointer;">
            <td>
                <div class="job__title" style="color: var(--primary-600); font-weight: 600;">${esc(o.title)}</div>
            </td>
            <td>${MODALITY_LABELS[o.modality] || '—'}</td>
            <td>${STATUS_PILLS[o.status] || o.status}</td>
            <td class="td-right">
                <a href="#/offers/edit/${o.id}" class="link" onclick="event.stopPropagation()">Edit</a>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.offer-row').forEach(row => {
        row.addEventListener('click', () => {
            const rowId = row.dataset.id;
            const offer = recent.find(o => String(o.id) === String(rowId));
            if (!offer) return;

            showOfferModal(offer);
        });
    });
}

/* ── Helpers ───────────────────────────────────────────────────── */

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
