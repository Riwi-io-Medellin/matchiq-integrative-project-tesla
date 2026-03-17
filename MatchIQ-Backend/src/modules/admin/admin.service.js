// src/modules/admin/admin.service.js
import pool from '../../config/db.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function getDashboard() {
    const companiesResult = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'company' AND is_active = true`
    );

    const candidatesResult = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'candidate' AND is_active = true`
    );

    const matchesResult = await pool.query(
        `SELECT COUNT(*) AS total FROM test_submissions WHERE status = 'evaluated'`
    );

    const latestCompaniesResult = await pool.query(
        `SELECT cp.id, cp.company_name, cp.location, u.email, u.is_active, u.created_at,
            COUNT(jo.id) AS total_offers
     FROM company_profiles cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN job_offers jo ON jo.company_id = cp.id
     GROUP BY cp.id, u.email, u.is_active, u.created_at
     ORDER BY u.created_at DESC
     LIMIT 5`
    );

    return {
        stats: {
            active_companies: parseInt(companiesResult.rows[0].total),
            total_candidates: parseInt(candidatesResult.rows[0].total),
            successful_matches: parseInt(matchesResult.rows[0].total),
        },
        latest_companies: latestCompaniesResult.rows,
    };
}

// ─── Gestión de empresas ──────────────────────────────────────────────────────
async function getCompanies({ search } = {}) {
    let query = `
    SELECT cp.id, cp.company_name, cp.location, cp.website, u.email, u.is_active, u.created_at,
           COUNT(jo.id) AS total_offers
    FROM company_profiles cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN job_offers jo ON jo.company_id = cp.id
  `;

    const values = [];

    if (search) {
        query += ` WHERE LOWER(cp.company_name) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1)`;
        values.push(`%${search}%`);
    }

    query += ` GROUP BY cp.id, u.email, u.is_active, u.created_at ORDER BY u.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
}

async function getCompanyById(companyId) {
    const result = await pool.query(
        `SELECT cp.*, u.email, u.is_active, u.created_at,
            COUNT(jo.id) AS total_offers
     FROM company_profiles cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN job_offers jo ON jo.company_id = cp.id
     WHERE cp.id = $1
     GROUP BY cp.id, u.email, u.is_active, u.created_at`,
        [companyId]
    );

    if (result.rows.length === 0) {
        throw new Error('Empresa no encontrada');
    }

    return result.rows[0];
}

// ─── Gestión de candidatos ────────────────────────────────────────────────────
async function getCandidates({ search } = {}) {
    let query = `
    SELECT cp.id, cp.experience_years, cp.seniority, cp.english_level,
           u.email, u.is_active, u.created_at
    FROM candidate_profiles cp
    JOIN users u ON u.id = cp.user_id
  `;

    const values = [];

    if (search) {
        query += ` WHERE LOWER(u.email) LIKE LOWER($1)`;
        values.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
}

async function getCandidateById(candidateId) {
    const result = await pool.query(
        `SELECT cp.*, u.email, u.is_active, u.created_at
     FROM candidate_profiles cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.id = $1`,
        [candidateId]
    );

    if (result.rows.length === 0) {
        throw new Error('Candidato no encontrado');
    }

    const candidate = result.rows[0];

    const categoriesResult = await pool.query(
        `SELECT c.id, c.name
     FROM candidate_categories cc
     JOIN categories c ON c.id = cc.category_id
     WHERE cc.candidate_id = $1`,
        [candidateId]
    );

    const skillsResult = await pool.query(
        `SELECT s.id, s.name, cat.name AS category
     FROM candidate_skills cs
     JOIN skills s ON s.id = cs.skill_id
     JOIN categories cat ON cat.id = s.category_id
     WHERE cs.candidate_id = $1`,
        [candidateId]
    );

    return {
        ...candidate,
        categories: categoriesResult.rows,
        skills: skillsResult.rows,
    };
}

// ─── Suspender / activar usuarios ─────────────────────────────────────────────
async function toggleUserStatus(userId, is_active) {
    const result = await pool.query(
        `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, role, is_active`,
        [is_active, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
}

export const adminService = {
    getDashboard,
    getCompanies,
    getCompanyById,
    getCandidates,
    getCandidateById,
    toggleUserStatus,
};