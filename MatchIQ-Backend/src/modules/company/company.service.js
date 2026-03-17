
import { companyRepository } from './company.repository.js';

async function completeProfile(userId, { company_name, description, website, location }) {
  if (!company_name) {
    throw new Error('El nombre de la empresa es obligatorio');
  }

  const profile = await companyRepository.updateProfile(userId, {
    company_name,
    description,
    website,
    location
  });

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  return profile;
}

async function getMyProfile(userId) {
  const profile = await companyRepository.getProfileByUserId(userId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  return profile;
}

export const companyService = {
  completeProfile,
  getMyProfile
};