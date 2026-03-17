import { Router } from 'express';
import { companyController } from './company.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

router.put('/profile', authenticate, authorize('company'), companyController.completeProfile);
router.get('/profile', authenticate, authorize('company'), companyController.getMyProfile);

export default router;