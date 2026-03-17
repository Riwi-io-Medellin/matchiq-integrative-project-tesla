import { Router } from 'express';
import { candidateController } from './candidate.controller.js';
import { authorize } from '../../middlewares/authorize.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Todas las rutas requieren estar autenticado y ser candidato
router.use(authenticate);
router.use(authorize('candidate'));

router.get('/profile', candidateController.getProfile);
router.patch('/profile', candidateController.updateProfile);
router.put('/categories', candidateController.updateCategories);
router.put('/skills', candidateController.updateSkills);

export default router;