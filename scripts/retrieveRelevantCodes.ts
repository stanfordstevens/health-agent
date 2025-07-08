import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type EmbeddedHealthCode = {
  code: string;
  description: string;
  embedding: number[];
};

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

async function retrieveRelevantCodes(question: string, topN = 5): Promise<EmbeddedHealthCode[]> {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: question,
  });

  const questionEmbedding = embeddingResponse.data[0].embedding;

  const dataFile = path.join(__dirname, '../data/health_codes_with_embeddings.json');
  const rawData = fs.readFileSync(dataFile, 'utf-8');
  const healthCodes: EmbeddedHealthCode[] = JSON.parse(rawData);

  const scored = healthCodes.map((entry) => ({
    ...entry,
    score: cosineSimilarity(questionEmbedding, entry.embedding),
  }));

  const topMatches = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ score, ...entry }) => entry);

  return topMatches;
}

// 🧪 If you want to test directly:
if (require.main === module) {
  const sampleQuestion = `While shaving, Robert accidentally caused a small cut on his chin that later became infected. He visited a healthcare provider who incised and drained the infected area. Which CPT code covers the incision and drainage of an infected cut?`;

  retrieveRelevantCodes(sampleQuestion, 3).then((matches) => {
    console.log('\nTop Matching Health Codes:\n');
    matches.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code} – ${code.description}`);
    });
  });
}

export { retrieveRelevantCodes, EmbeddedHealthCode };
