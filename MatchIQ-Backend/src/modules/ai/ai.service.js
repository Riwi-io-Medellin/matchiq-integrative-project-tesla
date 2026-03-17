import openai from "./openAI.API.js";

// Ahora evalúa UN solo candidato en lugar de todos juntos
export async function evaluateSingleCandidate(offer, candidate) {

  try {

    const prompt = `
You are an expert technical recruiter.

Analyze the following job offer and the candidate selected by the system.

JOB OFFER
Title: ${offer.title}
Description: ${offer.description}
Minimum experience: ${offer.min_experience_years}
Required English level: ${offer.required_english_level}

CANDIDATE
id: ${candidate.candidate_id}
match_score: ${candidate.final_match_percentage}
experience_years: ${candidate.experience_years}
english_level: ${candidate.english_level}
skills: ${candidate.matched_skills}

Explain briefly why this candidate is a good or weak match.

Return ONLY valid JSON with this structure:

{
  "candidate_id": "string",
  "fit_score": number,
  "insight": "short recruiter explanation",
  "strengths": ["string"],
  "opportunity for improvement": ["string"],
  "recommendation": "strong" | "moderate" | "weak"
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.choices[0].message.content;

    // Retorna directamente el objeto del candidato
    return JSON.parse(content);

  } catch (error) {

    console.error("AI evaluation error:", error.message);

    // Si falla un candidato, retorna null sin romper los demás
    return null;

  }

}