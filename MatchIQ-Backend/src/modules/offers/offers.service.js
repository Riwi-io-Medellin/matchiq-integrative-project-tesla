import pool from '../../config/db.js';

// ─── Crear oferta con categorías y skills ─────────────────────────────────────
async function createOffer(userId, {
  title,
  description,
  salary,
  modality,
  min_experience_years,
  required_english_level,
  positions_available,
  category_ids,
  skill_ids,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener company_id del usuario autenticado
    const companyResult = await client.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [userId]
    );

    if (companyResult.rows.length === 0) {
      throw new Error('Perfil de empresa no encontrado');
    }

    const companyId = companyResult.rows[0].id;

    // 2. Verificar que las categorías existen
    const catPlaceholders = category_ids.map(
      (_, i) => `$${i + 1}`
    ).join(', ');
    const categoryCheck = await client.query(
      `SELECT id FROM categories WHERE id IN (${catPlaceholders})`,
      category_ids
    );

    if (categoryCheck.rows.length !== category_ids.length) {
      throw new Error('Una o más categorías no existen');
    }

    // 3. Verificar que los skills existen
    const skillPlaceholders = skill_ids.map(
      (_, i) => `$${i + 1}`
    ).join(', ');
    const skillCheck = await client.query(
      `SELECT id FROM skills WHERE id IN (${skillPlaceholders})`,
      skill_ids
    );

    if (skillCheck.rows.length !== skill_ids.length) {
      throw new Error('Uno o más skills no existen');
    }

    // 4. Crear la oferta
    const offerResult = await client.query(
      `INSERT INTO job_offers (
        company_id, title, description, salary, modality,
        min_experience_years, required_english_level, positions_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        companyId,
        title,
        description ?? null,
        salary ?? null,
        modality,
        min_experience_years ?? null,
        required_english_level ?? null,
        positions_available ?? 1,
      ]
    );

    const offer = offerResult.rows[0];

    // 5. Insertar categorías de la oferta
    for (const categoryId of category_ids) {
      await client.query(
        'INSERT INTO offer_categories (offer_id, category_id) VALUES ($1, $2)',
        [offer.id, categoryId]
      );
    }

    // 6. Insertar skills de la oferta
    for (const skillId of skill_ids) {
      await client.query(
        'INSERT INTO offer_skills (offer_id, skill_id) VALUES ($1, $2)',
        [offer.id, skillId]
      );
    }

    await client.query('COMMIT');

    return offer;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ─── Listar ofertas de la empresa autenticada ─────────────────────────────────
async function getMyOffers(userId) {
  const companyResult = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = $1',
    [userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Perfil de empresa no encontrado');
  }

  const companyId = companyResult.rows[0].id;

  const result = await pool.query(
    `SELECT id, title, description, salary, modality,
            min_experience_years, required_english_level,
            positions_available, status, created_at
     FROM job_offers
     WHERE company_id = $1
     ORDER BY created_at DESC`,
    [companyId]
  );

  return result.rows;
}

// ─── Ver detalle de una oferta ────────────────────────────────────────────────
async function getOfferById(userId, offerId) {
  // Verificar que la oferta pertenece a la empresa autenticada
  const companyResult = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = $1',
    [userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Perfil de empresa no encontrado');
  }

  const companyId = companyResult.rows[0].id;

  const offerResult = await pool.query(
    `SELECT id, title, description, salary, modality,
            min_experience_years, required_english_level,
            positions_available, status, created_at
     FROM job_offers
     WHERE id = $1 AND company_id = $2`,
    [offerId, companyId]
  );

  if (offerResult.rows.length === 0) {
    throw new Error('Oferta no encontrada');
  }

  const offer = offerResult.rows[0];

  // Categorías de la oferta
  const categoriesResult = await pool.query(
    `SELECT c.id, c.name
     FROM offer_categories oc
     JOIN categories c ON c.id = oc.category_id
     WHERE oc.offer_id = $1`,
    [offerId]
  );

  // Skills de la oferta
  const skillsResult = await pool.query(
    `SELECT s.id, s.name, cat.name AS category
     FROM offer_skills os
     JOIN skills s ON s.id = os.skill_id
     JOIN categories cat ON cat.id = s.category_id
     WHERE os.offer_id = $1`,
    [offerId]
  );

  return {
    ...offer,
    categories: categoriesResult.rows,
    skills: skillsResult.rows,
  };
}

// ─── Editar oferta ────────────────────────────────────────────────────────────
async function updateOffer(userId, offerId, {
  title,
  description,
  salary,
  modality,
  min_experience_years,
  required_english_level,
  positions_available,
}) {
  // Verificar que la oferta pertenece a la empresa autenticada
  const companyResult = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = $1',
    [userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Perfil de empresa no encontrado');
  }

  const companyId = companyResult.rows[0].id;

  const existingOffer = await pool.query(
    'SELECT id, status FROM job_offers WHERE id = $1 AND company_id = $2',
    [offerId, companyId]
  );

  if (existingOffer.rows.length === 0) {
    throw new Error('Oferta no encontrada');
  }

  if (existingOffer.rows[0].status !== 'open') {
    throw new Error('Solo se pueden editar ofertas en estado open');
  }

  // Construir SET dinámico
  const fields = [];
  const values = [];
  let idx = 1;

  if (title !== undefined)                { fields.push(`title = $${idx++}`);                  values.push(title); }
  if (description !== undefined)          { fields.push(`description = $${idx++}`);            values.push(description); }
  if (salary !== undefined)               { fields.push(`salary = $${idx++}`);                 values.push(salary); }
  if (modality !== undefined)             { fields.push(`modality = $${idx++}`);               values.push(modality); }
  if (min_experience_years !== undefined) { fields.push(`min_experience_years = $${idx++}`);   values.push(min_experience_years); }
  if (required_english_level !== undefined) { fields.push(`required_english_level = $${idx++}`); values.push(required_english_level); }
  if (positions_available !== undefined)  { fields.push(`positions_available = $${idx++}`);    values.push(positions_available); }

  if (fields.length === 0) {
    throw new Error('No se enviaron campos para actualizar');
  }

  values.push(offerId);

  const result = await pool.query(
    `UPDATE job_offers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
}

// ─── Cancelar oferta ──────────────────────────────────────────────────────────
async function updateOfferStatus(userId, offerId, { status }) {
  const companyResult = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = $1',
    [userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Perfil de empresa no encontrado');
  }

  const companyId = companyResult.rows[0].id;

  const existingOffer = await pool.query(
    'SELECT id, status FROM job_offers WHERE id = $1 AND company_id = $2',
    [offerId, companyId]
  );

  if (existingOffer.rows.length === 0) {
    throw new Error('Oferta no encontrada');
  }

  if (existingOffer.rows[0].status === 'completed') {
    throw new Error('No se puede modificar una oferta ya completada');
  }

  // Verificar si hay candidatos en proceso al cancelar
  if (status === 'cancelled') {
    const inProcessResult = await pool.query(
      `SELECT COUNT(*) AS total FROM matches
       WHERE offer_id = $1 AND stage IN ('test_sent', 'test_completed')`,
      [offerId]
    );

    const total = parseInt(inProcessResult.rows[0].total);

    if (total > 0) {
      return {
        warning: true,
        message: `Hay ${total} candidato(s) en proceso de presentar el test. ¿Confirmas que deseas cancelar la oferta?`,
        candidates_in_process: total,
      };
    }
  }

  const result = await pool.query(
    'UPDATE job_offers SET status = $1 WHERE id = $2 RETURNING *',
    [status, offerId]
  );

  return result.rows[0];
}

// ─── Confirmar cancelación forzada ────────────────────────────────────────────
async function forceCancel(userId, offerId) {
  const companyResult = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = $1',
    [userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Perfil de empresa no encontrado');
  }

  const companyId = companyResult.rows[0].id;

  const existingOffer = await pool.query(
    'SELECT id FROM job_offers WHERE id = $1 AND company_id = $2',
    [offerId, companyId]
  );

  if (existingOffer.rows.length === 0) {
    throw new Error('Oferta no encontrada');
  }

  const result = await pool.query(
    'UPDATE job_offers SET status = $1 WHERE id = $2 RETURNING *',
    ['cancelled', offerId]
  );

  return result.rows[0];
}

export const offerService = {
  createOffer,
  getMyOffers,
  getOfferById,
  updateOffer,
  updateOfferStatus,
  forceCancel,
};