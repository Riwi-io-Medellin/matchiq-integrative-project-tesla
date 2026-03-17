// src/modules/company/company.controller.js
import { companyService } from './company.service.js';

async function completeProfile(req, res) {
  try {
    const userId = req.user.id;
    const { company_name, description, website, location } = req.body;

    const profile = await companyService.completeProfile(userId, {
      company_name,
      description,
      website,
      location
    });

    return res.json({ message: 'Perfil actualizado correctamente', profile });

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;

    const profile = await companyService.getMyProfile(userId);

    return res.json({ profile });

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export const companyController = {
  completeProfile,
  getMyProfile
};