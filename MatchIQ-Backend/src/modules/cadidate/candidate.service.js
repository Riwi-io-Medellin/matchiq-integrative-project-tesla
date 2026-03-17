import pool from '../../config/db.js';

async function getProfile(userId) {
  const profileResult = await pool.query(
    `SELECT cp.id, cp.first_name, cp.last_name, cp.experience_years, cp.seniority, cp.english_level, cp.github_link, cp.created_at
     FROM candidate_profiles cp
     WHERE cp.user_id = $1`,
    [userId]
  );

  if (profileResult.rows.length === 0) {
    throw new Error('Perfil de candidato no encontrado');
  }

  const profile = profileResult.rows[0];

  const categoriesResult = await pool.query(
    `SELECT c.id, c.name
     FROM candidate_categories cc
     JOIN categories c ON c.id = cc.category_id
     WHERE cc.candidate_id = $1`,
    [profile.id]
  );

  const skillsResult = await pool.query(
    `SELECT s.id, s.name, cat.name AS category
     FROM candidate_skills cs
     JOIN skills s ON s.id = cs.skill_id
     JOIN categories cat ON cat.id = s.category_id
     WHERE cs.candidate_id = $1`,
    [profile.id]
  );

  return {
    ...profile,
    categories: categoriesResult.rows,
    skills: skillsResult.rows,
  };
}

async function updateProfile(userId, { experience_years, seniority, english_level, first_name, last_name, github_link }) {
   console.log("updateProfile called with:", { userId, first_name, last_name, experience_years, seniority, english_level });
  const fields = [];
  const values = [];
  let idx = 1;

  if (first_name !== undefined) {
    fields.push(`first_name = $${idx++}`);
    values.push(first_name);
  }
  if (last_name !== undefined) {
    fields.push(`last_name = $${idx++}`);
    values.push(last_name);
  }
  if (experience_years !== undefined) {
    fields.push(`experience_years = $${idx++}`);
    values.push(experience_years);
  }
  if (seniority !== undefined) {
    fields.push(`seniority = $${idx++}`);
    values.push(seniority);
  }
  if (english_level !== undefined) {
    fields.push(`english_level = $${idx++}`);
    values.push(english_level);
  }
  if (github_link !== undefined) {
    fields.push(`github_link = $${idx++}`);
    values.push(github_link);
  }

  if (fields.length === 0) {
    throw new Error('No se enviaron campos para actualizar');
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE candidate_profiles
     SET ${fields.join(', ')}
     WHERE user_id = $${idx}
     RETURNING id, first_name, last_name, experience_years, seniority, english_level, github_link`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Perfil de candidato no encontrado');
  }

  return result.rows[0];
}

async function updateCategories(userId, { category_ids }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const profileResult = await client.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Perfil de candidato no encontrado');
    }

    const candidateId = profileResult.rows[0].id;

    const categoryCheck = await client.query(
      'SELECT id FROM categories WHERE id = ANY($1)',
      [category_ids]
    );

    if (categoryCheck.rows.length !== category_ids.length) {
      throw new Error('Una o más categorías no existen');
    }

    await client.query(
      'DELETE FROM candidate_categories WHERE candidate_id = $1',
      [candidateId]
    );

    for (const categoryId of category_ids) {
      await client.query(
        'INSERT INTO candidate_categories (candidate_id, category_id) VALUES ($1, $2)',
        [candidateId, categoryId]
      );
    }

    await client.query('COMMIT');

    const result = await pool.query(
      `SELECT c.id, c.name
       FROM candidate_categories cc
       JOIN categories c ON c.id = cc.category_id
       WHERE cc.candidate_id = $1`,
      [candidateId]
    );

    return { categories: result.rows };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateSkills(userId, { skills }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const profileResult = await client.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Perfil de candidato no encontrado');
    }

    const candidateId = profileResult.rows[0].id;

    // Verificar que todos los skills existen
    const skillIds = skills.map(s => s.skill_id);

    const skillCheck = await client.query(
      'SELECT id FROM skills WHERE id = ANY($1)',
      [skillIds]
    );

    if (skillCheck.rows.length !== skillIds.length) {
      throw new Error('Uno o más skills no existen');
    }

    // Eliminar skills anteriores
    await client.query(
      'DELETE FROM candidate_skills WHERE candidate_id = $1',
      [candidateId]
    );

    // Insertar nuevos skills
    for (const skill of skills) {
      await client.query(
        'INSERT INTO candidate_skills (candidate_id, skill_id) VALUES ($1, $2)',
        [candidateId, skill.skill_id]
      );
    }

    await client.query('COMMIT');

    // Retornar skills actualizados
    const result = await pool.query(
      `SELECT s.id, s.name, cat.name AS category
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       JOIN categories cat ON cat.id = s.category_id
       WHERE cs.candidate_id = $1`,
      [candidateId]
    );

    return { skills: result.rows };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const candidateService = {
  getProfile,
  updateProfile,
  updateCategories,
  updateSkills,
};