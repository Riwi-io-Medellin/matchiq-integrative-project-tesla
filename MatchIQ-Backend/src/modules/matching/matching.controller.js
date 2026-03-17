import { runMatching } from "./matching.service.js";
import db from "../../config/db.js";

export async function runMatchingController(req, res, next) {

  try {

    const { offerId } = req.params;
    const { aiTop } = req.query;

    if (!offerId) {
      return res.status(400).json({
        success: false,
        message: "offerId is required"
      });
    }

    const { ranking, aiCandidates } =
      await runMatching(offerId, aiTop);

    return res.status(200).json({
      success: true,
      message: "Matching executed successfully",
      total_candidates: ranking.length,
      ranking,
      ai_evaluation_candidates: aiCandidates
    });

  } catch (error) {

    console.error("Matching controller error:", error);

    next(error);

  }

}

/**
 * POST /matching/job-offers/:offerId/candidates/:candidateId/notify
 * Company notifies a candidate about their status.
 * Sends data to n8n webhook which triggers Gmail email.
 */
export async function notifyCandidateController(req, res) {
  try {
    const { offerId, candidateId } = req.params;
    const { status } = req.body;

    const validStatuses = ["technical_test", "approved", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // 1. Get candidate email and name
    const candidateResult = await db.query(
      `SELECT u.email, cp.first_name, cp.last_name
       FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.id = $1`,
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const candidate = candidateResult.rows[0];

    // 2. Get offer info
    const offerResult = await db.query(
      `SELECT jo.title, cp.company_name
       FROM job_offers jo
       JOIN company_profiles cp ON cp.id = jo.company_id
       WHERE jo.id = $1`,
      [offerId]
    );

    const offer = offerResult.rows[0] || {};

    // 3. Send to n8n webhook
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    let notified = false;

    if (n8nUrl) {
      try {
        const webhookResponse = await fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_email: candidate.email,
            candidate_name: `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || candidate.email,
            offer_title: offer.title || "N/A",
            company_name: offer.company_name || "N/A",
            status,
            offer_id: offerId,
            candidate_id: candidateId,
          }),
        });

        notified = webhookResponse.ok;

        if (!notified) {
          console.error("[Notify] n8n webhook error:", webhookResponse.status, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("[Notify] n8n webhook failed:", webhookError.message);
        notified = false;
      }
    } else {
      console.warn("[Notify] N8N_WEBHOOK_URL not configured in .env");
    }

    return res.status(200).json({
      success: true,
      message: "Notificacion enviada correctamente",
      notified,
      candidate_email: candidate.email
    });

  } catch (error) {
    console.error("[Notify] Controller error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
