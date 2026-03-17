const VALID_SENIORITY = ['junior', 'mid', 'senior'];
const VALID_ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function validateUpdateProfile({ experience_years, seniority, english_level }) {
  if (experience_years !== undefined) {
    if (typeof experience_years !== 'number' || !Number.isInteger(experience_years)) {
      throw new Error('Los años de experiencia deben ser un número entero');
    }
    if (experience_years < 0) {
      throw new Error('Los años de experiencia no pueden ser negativos');
    }
  }

  if (seniority !== undefined) {
    if (!VALID_SENIORITY.includes(seniority)) {
      throw new Error(`El seniority debe ser uno de: ${VALID_SENIORITY.join(', ')}`);
    }
  }

  if (english_level !== undefined) {
    if (!VALID_ENGLISH_LEVELS.includes(english_level)) {
      throw new Error(`El nivel de inglés debe ser uno de: ${VALID_ENGLISH_LEVELS.join(', ')}`);
    }
  }
}

export function validateUpdateCategories({ category_ids }) {
  if (!category_ids) {
    throw new Error('category_ids es obligatorio');
  }

  if (!Array.isArray(category_ids)) {
    throw new Error('category_ids debe ser un arreglo');
  }

  if (category_ids.length === 0) {
    throw new Error('Debes seleccionar al menos una categoría');
  }


  for (const id of category_ids) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('Cada category_id debe ser un UUID válido');
    }
  }
}

export function validateUpdateSkills({ skills }) {
  if (!skills) {
    throw new Error('skills es obligatorio');
  }

  if (!Array.isArray(skills)) {
    throw new Error('skills debe ser un arreglo');
  }

  if (skills.length === 0) {
    throw new Error('Debes seleccionar al menos un skill');
  }

  for (const skill of skills) {
    if (typeof skill !== 'object' || skill === null) {
      throw new Error('Cada skill debe ser un objeto con skill_id y level');
    }


    if (!skill.skill_id || typeof skill.skill_id !== 'string' || skill.skill_id.trim() === '') {
      throw new Error('Cada skill debe tener un skill_id válido');
    }

    if (skill.level === undefined || skill.level === null) {
      throw new Error('Cada skill debe tener un level');
    }

    if (typeof skill.level !== 'number' || !Number.isInteger(skill.level)) {
      throw new Error('El level de cada skill debe ser un número entero');
    }

    if (skill.level < 1 || skill.level > 5) {
      throw new Error('El level de cada skill debe estar entre 1 y 5');
    }
  }
}