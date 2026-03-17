import db from "../../config/db.js";
import { evaluateSingleCandidate } from "../ai/ai.service.js";

// aiTop baja a 3 por defecto en lugar de 5
export async function runMatching(offerId, aiTop = 3) {

  try {

    const query = `
      SELECT *
      FROM get_candidate_matches($1)
      ORDER BY final_match_percentage DESC  
    `;

    const result = await db.query(query, [offerId]);

    const ranking = result.rows;

    if (!ranking || ranking.length === 0) {
      return {
        ranking: [],
        aiCandidates: []
      };
    }

    // Enrich ranking with email and github_link
    const candidateIds = ranking.map(r => r.candidate_id);
    const enrichResult = await db.query(
      `SELECT cp.id, u.email, cp.github_link
       FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.id = ANY($1)`,
      [candidateIds]
    );
    const enrichMap = new Map(enrichResult.rows.map(r => [r.id, r]));
    ranking.forEach(r => {
      const extra = enrichMap.get(r.candidate_id);
      if (extra) {
        r.email = extra.email || '';
        r.github_link = extra.github_link || '';
      }
    });

    const offerQuery = `
      SELECT id, title, description, min_experience_years, required_english_level
      FROM job_offers
      WHERE id = $1
    `;

    const offerResult = await db.query(offerQuery, [offerId]);
    const offer = offerResult.rows[0];

    const topCandidates = ranking.slice(0, aiTop);

    // Lanza todas las llamadas a la IA AL MISMO TIEMPO en paralelo
    // En lugar de esperar una por una, esperamos que todas terminen juntas
    const aiResults = await Promise.all(
      topCandidates.map(candidate => evaluateSingleCandidate(offer, candidate))
    );

    // Integramos el feedback usando el índice del array
    // Ya no necesitamos buscar por candidate_id porque el orden se mantiene
    for (let i = 0; i < topCandidates.length; i++) {

      const aiCandidate = aiResults[i];

      // Solo asignamos si la IA no retornó null para ese candidato
      if (aiCandidate) {

        topCandidates[i].ai_feedback = aiCandidate;

        const adjustedScore =
          topCandidates[i].final_match_percentage * 0.9 +
          aiCandidate.fit_score * 0.1;

        topCandidates[i].adjusted_score = Number(adjustedScore.toFixed(2));

      }

    }

    return {
      ranking,
      aiCandidates: topCandidates
    };

  } catch (error) {

    console.error("Matching service error:", error);

    throw error;

  }

}
