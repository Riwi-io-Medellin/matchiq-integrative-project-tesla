const VALID_MODALITY = ['remote', 'onsite', 'hybrid'];
const VALID_ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_STATUS = ['open', 'in_process', 'completed', 'cancelled'];

export function validateCreateOffer({
  title,
  modality,
  category_ids,
  skill_ids,
  description,
  salary,
  min_experience_years,
  required_english_level,
  positions_available,
}) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('El título es obligatorio');
  }

  if (!modality) {
    throw new Error('La modalidad es obligatoria');
  }

  if (!VALID_MODALITY.includes(modality)) {
    throw new Error(`La modalidad debe ser una de: ${VALID_MODALITY.join(', ')}`);
  }

  if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
    throw new Error('Debes indicar al menos una categoría requerida');
  }


  for (const id of category_ids) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('Cada category_id debe ser un UUID válido');
    }
  }

  if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
    throw new Error('Debes indicar al menos un skill requerido');
  }


  for (const id of skill_ids) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('Cada skill_id debe ser un UUID válido');
    }
  }

  if (salary !== undefined && salary !== null) {
    if (typeof salary !== 'number' || salary < 0) {
      throw new Error('El salario debe ser un número positivo');
    }
  }

  if (min_experience_years !== undefined && min_experience_years !== null) {
    if (!Number.isInteger(min_experience_years) || min_experience_years < 0) {
      throw new Error('Los años mínimos de experiencia deben ser un entero positivo');
    }
  }

  if (required_english_level !== undefined && required_english_level !== null) {
    if (!VALID_ENGLISH_LEVELS.includes(required_english_level)) {
      throw new Error(`El nivel de inglés debe ser uno de: ${VALID_ENGLISH_LEVELS.join(', ')}`);
    }
  }

  if (positions_available !== undefined && positions_available !== null) {
    if (!Number.isInteger(positions_available) || positions_available < 1) {
      throw new Error('Las posiciones disponibles deben ser un entero mayor a 0');
    }
  }
}

export function validateUpdateOffer({
  title,
  modality,
  description,
  salary,
  min_experience_years,
  required_english_level,
  positions_available,
}) {
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('El título no puede estar vacío');
    }
  }

  if (modality !== undefined) {
    if (!VALID_MODALITY.includes(modality)) {
      throw new Error(`La modalidad debe ser una de: ${VALID_MODALITY.join(', ')}`);
    }
  }

  if (salary !== undefined && salary !== null) {
    if (typeof salary !== 'number' || salary < 0) {
      throw new Error('El salario debe ser un número positivo');
    }
  }

  if (min_experience_years !== undefined && min_experience_years !== null) {
    if (!Number.isInteger(min_experience_years) || min_experience_years < 0) {
      throw new Error('Los años mínimos de experiencia deben ser un entero positivo');
    }
  }

  if (required_english_level !== undefined && required_english_level !== null) {
    if (!VALID_ENGLISH_LEVELS.includes(required_english_level)) {
      throw new Error(`El nivel de inglés debe ser uno de: ${VALID_ENGLISH_LEVELS.join(', ')}`);
    }
  }

  if (positions_available !== undefined && positions_available !== null) {
    if (!Number.isInteger(positions_available) || positions_available < 1) {
      throw new Error('Las posiciones disponibles deben ser un entero mayor a 0');
    }
  }
}

export function validateCancelOffer({ status }) {
  if (!status) {
    throw new Error('El status es obligatorio');
  }

  if (!VALID_STATUS.includes(status)) {
    throw new Error(`El status debe ser uno de: ${VALID_STATUS.join(', ')}`);
  }
}