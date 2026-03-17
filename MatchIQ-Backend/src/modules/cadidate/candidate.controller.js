import { candidateService } from './candidate.service.js';
import {
  validateUpdateProfile,
  validateUpdateCategories,
  validateUpdateSkills,
} from './candidate.validation.js';

// GET /candidate/profile
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const profile = await candidateService.getProfile(userId);

    return res.json(profile);

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// PATCH /candidate/profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { experience_years, seniority, english_level, first_name, last_name, github_link } = req.body;

    validateUpdateProfile({ experience_years, seniority, english_level });

    const result = await candidateService.updateProfile(userId, {
      experience_years,
      seniority,
      english_level,
      first_name,
      last_name,
      github_link,
    });

    return res.json(result);

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// PUT /candidate/categories
async function updateCategories(req, res) {
  try {
    const userId = req.user.id;
    const { category_ids } = req.body;

    validateUpdateCategories({ category_ids });

    const result = await candidateService.updateCategories(userId, { category_ids });

    return res.json(result);

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// PUT /candidate/skills
async function updateSkills(req, res) {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    validateUpdateSkills({ skills });

    const result = await candidateService.updateSkills(userId, { skills });

    return res.json(result);

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export const candidateController = {
  getProfile,
  updateProfile,
  updateCategories,
  updateSkills,
};