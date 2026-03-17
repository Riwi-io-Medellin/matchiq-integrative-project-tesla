import db from "../../config/db.js";
import { generateGorillaTest } from "../ai/gorilla.ai.service.js";

/**
 * Generates a Gorilla Test and saves it to the `tests` table.
 * Called automatically from offers.controller.js after offer creation.
 *
 * Fills exactly the existing columns:
 *   offer_id            → offer.id
 *   description         → JSON string with full test (questions + answers + metadata)
 *   time_limit_minutes  → 30 (default)
 *   created_at          → NOW()
 *
 * @param {string} offerId        - UUID of the newly created offer
 * @param {boolean} forceRegenerate - if true, deletes previous test for this offer first
 */
export async function generateGorillaTestService(offerId, forceRegenerate = false) {

  // 1. Fetch offer data needed for the AI prompt
  const offerResult = await db.query(
    `SELECT id, title, description, min_experience_years, required_english_level
     FROM job_offers
     WHERE id = $1`,
    [offerId]
  );

  const offer = offerResult.rows[0];
  if (!offer) throw new Error(`Job offer ${offerId} not found`);

  // 2. If forceRegenerate, delete previous test for this offer
  if (forceRegenerate) {
    await db.query(`DELETE FROM tests WHERE offer_id = $1`, [offerId]);
  } else {
    // If a test already exists and no force flag, return it without regenerating
    const existing = await db.query(
      `SELECT * FROM tests WHERE offer_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [offerId]
    );
    if (existing.rows.length > 0) {
      return {
        message: "Test already exists for this offer",
        test: existing.rows[0],
        regenerated: false,
      };
    }
  }

  // 3. Generate 15 questions via AI
  // No candidates at offer creation time — AI uses only the offer content
  const aiTest = await generateGorillaTest(offer, []);

  // 4. Build the JSON payload stored in `description`
  const descriptionPayload = JSON.stringify({
    test_title:      aiTest.test_title,
    total_questions: aiTest.total_questions,
    questions:       aiTest.questions,     // includes correct_answer, explanation, gorilla_hint
    type:            "gorilla",
    generated_at:    new Date().toISOString(),
  });

  // 5. INSERT into tests -- only the existing columns
  const insertResult = await db.query(
    `INSERT INTO tests (offer_id, description, time_limit_minutes, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [
      offerId,
      descriptionPayload,
      30,
    ]
  );

  return {
    message: "Gorilla test generated successfully",
    test:      insertResult.rows[0],
    regenerated: forceRegenerate,
  };
}

/**
 * Returns the test for a job offer WITHOUT correct answers.
 * Safe to send directly to candidates.
 */
export async function getGorillaTestForCandidateService(offerId) {
  const result = await db.query(
    `SELECT id, offer_id, time_limit_minutes, created_at, description
     FROM tests
     WHERE offer_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [offerId]
  );

  if (result.rows.length === 0) {
    throw new Error(`No gorilla test found for offer ${offerId}`);
  }

  const row    = result.rows[0];
  const parsed = JSON.parse(row.description);

  // Strip sensitive fields before returning to candidate
  const safeQuestions = parsed.questions.map(
    ({ correct_answer, explanation, gorilla_hint, ...q }) => q
  );

  return {
    id:                 row.id,
    offer_id:           row.offer_id,
    test_title:         parsed.test_title,
    total_questions:    parsed.total_questions,
    time_limit_minutes: row.time_limit_minutes,
    created_at:         row.created_at,
    questions:          safeQuestions,
  };
}

/**
 * Returns the full test WITH correct answers and explanations.
 * For internal / admin use only.
 */
export async function getFullGorillaTestService(offerId) {
  const result = await db.query(
    `SELECT * FROM tests WHERE offer_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [offerId]
  );

  if (result.rows.length === 0) {
    throw new Error(`No gorilla test found for offer ${offerId}`);
  }

  const row    = result.rows[0];
  const parsed = JSON.parse(row.description);

  return {
    id:                 row.id,
    offer_id:           row.offer_id,
    test_title:         parsed.test_title,
    total_questions:    parsed.total_questions,
    time_limit_minutes: row.time_limit_minutes,
    created_at:         row.created_at,
    questions:          parsed.questions,
  };
}

/**
 * Returns the test row for a given offer_id.
 * Used by n8n to get the test reference when sending candidate emails.
 */
export async function getTestByOfferIdService(offerId) {
  const result = await db.query(
    `SELECT id, offer_id, time_limit_minutes, created_at
     FROM tests
     WHERE offer_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [offerId]
  );

  if (result.rows.length === 0) {
    throw new Error(`No test found for offer ${offerId}`);
  }

  return result.rows[0];
}