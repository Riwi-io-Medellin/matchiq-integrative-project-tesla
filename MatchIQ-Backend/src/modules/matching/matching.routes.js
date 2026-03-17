import { Router } from "express";
import { runMatchingController, notifyCandidateController } from "./matching.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

router.get("/job-offers/:offerId/matches", authenticate, authorize("company", "admin"), runMatchingController);

// POST /matching/job-offers/:offerId/candidates/:candidateId/notify
// Company notifies a candidate (triggers n8n webhook for email)
router.post(
  "/job-offers/:offerId/candidates/:candidateId/notify",
  authenticate,
  authorize("company"),
  notifyCandidateController
);

export default router;
