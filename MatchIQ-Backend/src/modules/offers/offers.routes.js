import { Router } from 'express';
import { offerController } from './offers.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

// Todas las rutas requieren estar autenticado y ser company
router.use(authenticate);
router.use(authorize('company'));

router.post('/',offerController.createOffer);
router.get('/', offerController.getMyOffers);
router.get('/:id',offerController.getOfferById);
router.patch('/:id',offerController.updateOffer);
router.patch('/:id/status',offerController.updateOfferStatus);
router.patch('/:id/force-cancel',offerController.forceCancel);

export default router;