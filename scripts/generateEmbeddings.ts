import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const inputFile = path.join(__dirname, '../data/health_codes.json');
const outputFile = path.join(__dirname, '../data/health_codes_with_embeddings.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings() {
  const rawData = fs.readFileSync(inputFile, 'utf-8');
  const codes = JSON.parse(rawData);

  const results = [];

  for (const entry of codes) {
    const text = `${entry.code}: ${entry.description}`;
    console.log(`Embedding: ${text}`);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    const embedding = response.data[0].embedding;
    results.push({ ...entry, embedding });
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`✅ Embeddings saved to ${outputFile}`);
}

generateEmbeddings().catch((err) => {
  console.error('❌ Error generating embeddings:', err);
});
