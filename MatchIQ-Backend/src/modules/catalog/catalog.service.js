// src/modules/catalog/catalog.service.js
import pool from '../../config/db.js';

async function getCategories() {
  const result = await pool.query(
    'SELECT id, name FROM categories ORDER BY name ASC'
  );
  return result.rows;
}

async function getSkillsByCategory(categoryId) {
  const categoryCheck = await pool.query(
    'SELECT id FROM categories WHERE id = $1',
    [categoryId]
  );

  if (categoryCheck.rows.length === 0) {
    throw new Error('Categoría no encontrada');
  }

  const result = await pool.query(
    'SELECT id, name FROM skills WHERE category_id = $1 ORDER BY name ASC',
    [categoryId]
  );

  return result.rows;
}

async function getAllSkills() {
  const result = await pool.query(
    `SELECT s.id, s.name, c.id AS category_id, c.name AS category
     FROM skills s
     JOIN categories c ON c.id = s.category_id
     ORDER BY c.name ASC, s.name ASC`
  );
  return result.rows;
}

async function createCategory({ name }) {
  if (!name || name.trim() === '') {
    throw new Error('El nombre de la categoría es obligatorio');
  }

  const existing = await pool.query(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
    [name]
  );

  if (existing.rows.length > 0) {
    throw new Error('Ya existe una categoría con ese nombre');
  }

  const result = await pool.query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
    [name.trim()]
  );

  return result.rows[0];
}

async function createSkill({ name, category_id }) {
  if (!name || name.trim() === '') {
    throw new Error('El nombre del skill es obligatorio');
  }

  if (!category_id) {
    throw new Error('La categoría es obligatoria');
  }

  const categoryCheck = await pool.query(
    'SELECT id FROM categories WHERE id = $1',
    [category_id]
  );

  if (categoryCheck.rows.length === 0) {
    throw new Error('La categoría no existe');
  }

  const existing = await pool.query(
    'SELECT id FROM skills WHERE LOWER(name) = LOWER($1) AND category_id = $2',
    [name, category_id]
  );

  if (existing.rows.length > 0) {
    throw new Error('Ya existe un skill con ese nombre en esa categoría');
  }

  const result = await pool.query(
    'INSERT INTO skills (name, category_id) VALUES ($1, $2) RETURNING id, name, category_id',
    [name.trim(), category_id]
  );

  return result.rows[0];
}

async function deleteCategory(categoryId) {
  const existing = await pool.query(
    'SELECT id FROM categories WHERE id = $1',
    [categoryId]
  );

  if (existing.rows.length === 0) {
    throw new Error('Categoría no encontrada');
  }

  await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);

  return { message: 'Categoría eliminada correctamente' };
}

async function deleteSkill(skillId) {
  const existing = await pool.query(
    'SELECT id FROM skills WHERE id = $1',
    [skillId]
  );

  if (existing.rows.length === 0) {
    throw new Error('Skill no encontrado');
  }

  await pool.query('DELETE FROM skills WHERE id = $1', [skillId]);

  return { message: 'Skill eliminado correctamente' };
}

export const catalogService = {
  getCategories,
  getSkillsByCategory,
  getAllSkills,
  createCategory,
  createSkill,
  deleteCategory,
  deleteSkill,
};