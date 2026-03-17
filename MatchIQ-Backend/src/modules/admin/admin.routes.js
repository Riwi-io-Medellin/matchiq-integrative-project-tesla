// src/modules/admin/admin.routes.js
import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

// Todas las rutas requieren estar autenticado y ser admin
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Empresas
router.get('/companies', adminController.getCompanies);
router.get('/companies/:id', adminController.getCompanyById);

// Candidatos
router.get('/candidates', adminController.getCandidates);
router.get('/candidates/:id', adminController.getCandidateById);

// Suspender / activar usuarios
router.patch('/users/:id/status', adminController.toggleUserStatus);

export default router;