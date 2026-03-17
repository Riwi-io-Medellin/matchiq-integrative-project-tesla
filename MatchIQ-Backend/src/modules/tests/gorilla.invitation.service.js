import db from "../../config/db.js";

/**
 * Company invites a candidate to take a gorilla test.
 * Creates a row in test_invitations with status 'pending'.
 */
export async function inviteCandidateService(offerId, candidateId) {
  // 1. Get the test for this offer
  const testResult = await db.query(
    `SELECT id FROM tests WHERE offer_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [offerId]
  );

  if (testResult.rows.length === 0) {
    throw new Error(`No test found for offer ${offerId}`);
  }

  const testId = testResult.rows[0].id;

  // 2. Check if invitation already exists
  const existing = await db.query(
    `SELECT id, status FROM test_invitations WHERE test_id = $1 AND candidate_id = $2`,
    [testId, candidateId]
  );

  if (existing.rows.length > 0) {
    return {
      message: "Candidate already invited",
      invitation: existing.rows[0],
      alreadyExists: true,
    };
  }

  // 3. Create invitation
  const result = await db.query(
    `INSERT INTO test_invitations (test_id, candidate_id, offer_id, status, invited_at)
     VALUES ($1, $2, $3, 'pending', NOW())
     RETURNING *`,
    [testId, candidateId, offerId]
  );

  // 4. Notify candidate via n8n (send email)
  try {
    const candidateData = await db.query(
      `SELECT u.email, cp.first_name, cp.last_name
       FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.id = $1`,
      [candidateId]
    );

    const offerData = await db.query(
      `SELECT jo.title, comp.company_name
       FROM job_offers jo
       JOIN company_profiles comp ON comp.id = jo.company_id
       WHERE jo.id = $1`,
      [offerId]
    );

    const candidate = candidateData.rows[0];
    const offer = offerData.rows[0];
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nUrl && candidate) {
      await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_email: candidate.email,
          candidate_name: `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || candidate.email,
          offer_title: offer?.title || "N/A",
          company_name: offer?.company_name || "N/A",
          status: "technical_test",
          offer_id: offerId,
          candidate_id: candidateId,
          test_id: testId,
        }),
      });
    }
  } catch (notifyError) {
    // Email notification failure should not break the invitation
    console.error("[Invitation] n8n notification failed:", notifyError.message);
  }

  return {
    message: "Candidate invited successfully",
    invitation: result.rows[0],
    alreadyExists: false,
  };
}

/**
 * Company invites multiple candidates at once.
 */
export async function inviteMultipleCandidatesService(offerId, candidateIds) {
  const results = [];

  for (const candidateId of candidateIds) {
    try {
      const result = await inviteCandidateService(offerId, candidateId);
      results.push({ candidate_id: candidateId, ...result });
    } catch (error) {
      results.push({ candidate_id: candidateId, error: error.message });
    }
  }

  return results;
}

/**
 * Returns all pending test invitations for a candidate.
 * Used by the candidate's dashboard.
 */
export async function getCandidateInvitationsService(candidateProfileId) {
  const result = await db.query(
    `SELECT
       ti.id,
       ti.test_id,
       ti.offer_id,
       ti.status,
       ti.invited_at,
       ti.completed_at,
       jo.title AS offer_title,
       jo.description AS offer_description,
       cp_company.company_name,
       t.time_limit_minutes
     FROM test_invitations ti
     JOIN job_offers jo ON jo.id = ti.offer_id
     JOIN company_profiles cp_company ON cp_company.id = jo.company_id
     JOIN tests t ON t.id = ti.test_id
     WHERE ti.candidate_id = $1
     ORDER BY ti.invited_at DESC`,
    [candidateProfileId]
  );

  return result.rows;
}

/**
 * Marks an invitation as completed.
 * Called automatically after a candidate submits a test.
 */
export async function completeInvitationService(testId, candidateId) {
  const result = await db.query(
    `UPDATE test_invitations
     SET status = 'completed', completed_at = NOW()
     WHERE test_id = $1 AND candidate_id = $2
     RETURNING *`,
    [testId, candidateId]
  );

  return result.rows[0] || null;
}
