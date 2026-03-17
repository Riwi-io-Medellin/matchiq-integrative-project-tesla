import pool from '../../config/db.js';

async function updateProfile(userId, { company_name, description, website, location }) {
  const result = await pool.query(
    `UPDATE company_profiles
     SET company_name = $1, description = $2, website = $3, location = $4
     WHERE user_id = $5
     RETURNING *`,
    [company_name, description, website, location, userId]
  );
  return result.rows[0];
}

async function getProfileByUserId(userId) {
  const result = await pool.query(
    `SELECT cp.*, u.email
     FROM company_profiles cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

export const companyRepository = {
  updateProfile,
  getProfileByUserId
};