import dotenv from "dotenv";
dotenv.config(); // Debe ser lo primero

import OpenAI from "openai";

// Validación opcional para evitar errores silenciosos
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY not set in .env. Please add it before running."
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;