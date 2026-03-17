import openai from "./openAI.API.js";


/**
 * Generates 15 Gorilla Test questions contextualized for a job offer.
 */
export async function generateGorillaTest(offer, candidates) {
  const candidatesSummary = candidates && candidates.length > 0 ? candidates
    .map(
      (c, i) =>
        `${i + 1}. Match: ${c.final_match_percentage}% | Skills: ${c.skills || "N/A"} | Experience: ${c.experience_years ?? "?"} years`
    )
    .join("\n") : "No candidates evaluated yet. Generate the test based strictly on the job offer profile above.";

  const prompt = `
You are an expert technical recruiter designing a cognitive attention test (Gorilla Test style).

The test has 10 questions based on the job offer below.
Gorilla Test principle: mix real technical questions with scenarios that have a hidden distractor 
embedded in plain sight — to measure attention, focus, and detail orientation.

Required distribution:
- 6 standard technical questions directly related to the role
- 2 scenario-based questions with a subtle distractor embedded
- 2 "gorilla" questions where an obvious anomaly is hidden in plain sight

JOB OFFER
Title: ${offer.title}
Description: ${offer.description}
Minimum experience: ${offer.min_experience_years} years
Required English level: ${offer.required_english_level}

TOP CANDIDATES (context only — do NOT include names in questions)
${candidatesSummary}

RULES:
- All 10 questions must be multiple choice with exactly 4 options (A, B, C, D).
- Each question has exactly ONE correct answer.
- Gorilla questions → "type": "gorilla"
- Standard questions → "type": "standard"
- Write ALL questions and answers in English.
- The correct_answer field must contain only the letter (e.g. "B").
- gorilla_hint is only required when type is "gorilla".

Return ONLY valid JSON — no markdown, no explanation, no extra text:

{
  "test_title": "string",
  "total_questions": 15,
  "questions": [
    {
      "id": 1,
      "type": "standard" | "gorilla",
      "question": "string",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "correct_answer": "A" | "B" | "C" | "D",
      "explanation": "brief explanation of why this answer is correct",
      "gorilla_hint": "describe the hidden distractor — only if type is gorilla"
    }
  ]
}
`;

  let response;
  try {
    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical recruiter specialized in cognitive and attention-based assessments.",
        },
        { role: "user", content: prompt },
      ],
    });
  } catch (aiError) {
    console.error("[GorillaAI] OpenAI API error:", aiError.message);
    throw new Error(
      `Error calling OpenAI API: ${aiError.message}`
    );
  }

  const raw = response.choices[0].message.content;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON returned by AI for gorilla test generation");
  }
}

/**
 * Evaluates a candidate's answers against the correct answers stored in the test.
 * @param {object} testData - Parsed object from tests.description (includes .questions)
 * @param {object} answers  - { "1": "A", "2": "C", ... }
 */
export async function evaluateGorillaAnswers(testData, answers) {
  let score = 0;
  let gorillaScore = 0;
  let gorillaTotalQuestions = 0;
  const details = [];

  for (const question of testData.questions) {
    const givenAnswer = answers[String(question.id)];
    const isCorrect = givenAnswer === question.correct_answer;

    if (question.type === "gorilla") {
      gorillaTotalQuestions++;
      if (isCorrect) gorillaScore++;
    }

    if (isCorrect) score++;

    details.push({
      question_id: question.id,
      type: question.type,
      given_answer: givenAnswer ?? null,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      explanation: question.explanation,
      gorilla_hint: question.gorilla_hint ?? null,
    });
  }

  const totalQuestions = testData.questions.length;
  const percentageScore = Number(((score / totalQuestions) * 100).toFixed(2));

  const gorillaPercentage =
    gorillaTotalQuestions > 0
      ? Number(((gorillaScore / gorillaTotalQuestions) * 100).toFixed(2))
      : null;

  let attentionLevel;
  if (gorillaPercentage === null) attentionLevel = "N/A";
  else if (gorillaPercentage >= 80) attentionLevel = "high";
  else if (gorillaPercentage >= 50) attentionLevel = "medium";
  else attentionLevel = "low";

  return {
    total_questions: totalQuestions,
    correct_answers: score,
    percentage_score: percentageScore,
    gorilla_questions_total: gorillaTotalQuestions,
    gorilla_questions_correct: gorillaScore,
    gorilla_percentage: gorillaPercentage,
    attention_level: attentionLevel,
    details,
  };
}