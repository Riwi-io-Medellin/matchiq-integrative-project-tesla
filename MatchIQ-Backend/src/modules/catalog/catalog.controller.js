// src/modules/catalog/catalog.controller.js
import { catalogService } from './catalog.service.js';

// GET /catalog/categories
async function getCategories(req, res) {
  try {
    const categories = await catalogService.getCategories();
    return res.json(categories);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// GET /catalog/categories/:id/skills
async function getSkillsByCategory(req, res) {
  try {
    const { id } = req.params;
    const skills = await catalogService.getSkillsByCategory(id);
    return res.json(skills);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// GET /catalog/skills
async function getAllSkills(req, res) {
  try {
    const skills = await catalogService.getAllSkills();
    return res.json(skills);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// POST /catalog/categories
async function createCategory(req, res) {
  try {
    const { name } = req.body;
    const category = await catalogService.createCategory({ name });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// POST /catalog/skills
async function createSkill(req, res) {
  try {
    const { name, category_id } = req.body;
    const skill = await catalogService.createSkill({ name, category_id });
    return res.status(201).json(skill);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// DELETE /catalog/categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const result = await catalogService.deleteCategory(id);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// DELETE /catalog/skills/:id
async function deleteSkill(req, res) {
  try {
    const { id } = req.params;
    const result = await catalogService.deleteSkill(id);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export const catalogController = {
  getCategories,
  getSkillsByCategory,
  getAllSkills,
  createCategory,
  createSkill,
  deleteCategory,
  deleteSkill,
};