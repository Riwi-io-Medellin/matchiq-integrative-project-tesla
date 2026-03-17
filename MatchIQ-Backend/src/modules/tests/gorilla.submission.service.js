import db from "../../config/db.js";
import { evaluateGorillaAnswers } from "../ai/gorilla.ai.service.js";
import { completeInvitationService } from "./gorilla.invitation.service.js";

/**
 * Saves and evaluates a candidate's answers for a Gorilla Test.
 *
 * Maps to existing `test_submissions` columns:
 *   submitted_code   → JSON string of candidate answers { "1": "A", "2": "C", ... }
 *   score            → percentage_score (0–100)
 *   feedback         → JSON string of full evaluation result
 *   status           → 'pending' on insert → 'evaluated' after AI processing
 *   ai_evaluated_at  → timestamp set after AI evaluation completes
 */
export async function submitGorillaTestService(testId, candidateId, answers) {

  // 1. Fetch the full test (includes correct answers stored in description)
  const testResult = await db.query(
    `SELECT * FROM tests WHERE id = $1`,
    [testId]
  );

  if (testResult.rows.length === 0) {
    throw new Error(`Test ${testId} not found`);
  }

  const testRow = testResult.rows[0];
  const testData = JSON.parse(testRow.description);

  if (testData.type !== "gorilla") {
    throw new Error(`Test ${testId} is not a gorilla test`);
  }

  // 2. Prevent duplicate submissions
  const existing = await db.query(
    `SELECT id FROM test_submissions
     WHERE test_id = $1 AND candidate_id = $2`,
    [testId, candidateId]
  );

  if (existing.rows.length > 0) {
    throw new Error(
      `Candidate ${candidateId} has already submitted answers for test ${testId}`
    );
  }

  // 3. Insert submission with status 'pending'
  let submission;
  try {
    const submissionInsert = await db.query(
      `INSERT INTO test_submissions
         (test_id, candidate_id, submitted_code, score, feedback, status, started_at, submitted_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
       RETURNING *`,
      [
        testId,
        candidateId,
        JSON.stringify(answers),
        0,
        null,
      ]
    );
    submission = submissionInsert.rows[0];
  } catch (dbError) {
    console.error("[GorillaSubmission] DB insert error:", dbError.message);
    throw new Error(`Error saving submission: ${dbError.message}`);
  }

  // 4. Evaluate answers
  let evaluation;
  try {
    evaluation = await evaluateGorillaAnswers(testData, answers);
  } catch (evalError) {
    console.error("[GorillaSubmission] Evaluation error:", evalError.message);
    throw new Error(`Error evaluating answers: ${evalError.message}`);
  }

  // 5. Update submission with evaluation results
  const updatedSubmission = await db.query(
    `UPDATE test_submissions
     SET
       score           = $1,
       feedback        = $2,
       status          = 'evaluated',
       ai_evaluated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [
      evaluation.percentage_score,
      JSON.stringify(evaluation),
      submission.id,
    ]
  );

  // 6. Mark invitation as completed (if one exists)
  try {
    await completeInvitationService(testId, candidateId);
  } catch {
    // Invitation may not exist — not an error
  }

  return {
    message: "Test submitted and evaluated successfully",
    submission: updatedSubmission.rows[0],
    evaluation,
  };
}

/**
 * Returns all submissions for a test, ranked by score DESC.
 * Joins with candidate_profiles to include name and profile data.
 */
export async function getTestSubmissionsService(testId) {
  const result = await db.query(
    `SELECT
       ts.id,
       ts.candidate_id,
       cp.first_name,
       cp.last_name,
       cp.seniority,
       cp.english_level,
       ts.score                                          AS percentage_score,
       ts.status,
       ts.submitted_at,
       ts.ai_evaluated_at,
       (ts.feedback::jsonb ->> 'attention_level')        AS attention_level,
       (ts.feedback::jsonb ->> 'gorilla_percentage')     AS gorilla_percentage,
       (ts.feedback::jsonb ->> 'correct_answers')        AS correct_answers,
       (ts.feedback::jsonb ->> 'total_questions')        AS total_questions
     FROM test_submissions ts
     LEFT JOIN candidate_profiles cp ON cp.id = ts.candidate_id
     WHERE ts.test_id = $1
     ORDER BY ts.score DESC`,
    [testId]
  );

  return result.rows;
}

/**
 * Returns the detailed result of a specific candidate for a test.
 */
export async function getCandidateSubmissionService(testId, candidateId) {
  const result = await db.query(
    `SELECT
       ts.*,
       cp.first_name,
       cp.last_name,
       cp.seniority,
       cp.english_level,
       cp.experience_years
     FROM test_submissions ts
     LEFT JOIN candidate_profiles cp ON cp.id = ts.candidate_id
     WHERE ts.test_id = $1 AND ts.candidate_id = $2`,
    [testId, candidateId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      `No submission found for candidate ${candidateId} in test ${testId}`
    );
  }

  const row = result.rows[0];

  return {
    ...row,
    evaluation: row.feedback ? JSON.parse(row.feedback) : null,
    answers: row.submitted_code ? JSON.parse(row.submitted_code) : null,
  };
}