// src/modules/catalog/catalog.routes.js
import { Router } from 'express';
import { catalogController } from './catalog.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

// ─── Rutas públicas (cualquier usuario autenticado) ───────────────────────────
router.use(authenticate);

router.get('/categories', catalogController.getCategories);
router.get('/categories/:id/skills', catalogController.getSkillsByCategory);
router.get('/skills', catalogController.getAllSkills);

// ─── Rutas solo admin ─────────────────────────────────────────────────────────
router.post('/categories', authorize('admin'), catalogController.createCategory);
router.post('/skills', authorize('admin'), catalogController.createSkill);
router.delete('/categories/:id', authorize('admin'), catalogController.deleteCategory);
router.delete('/skills/:id', authorize('admin'), catalogController.deleteSkill);

export default router;