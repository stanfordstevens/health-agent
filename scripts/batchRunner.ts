import fs from 'fs';
import path from 'path';
import { runAgent } from './agent';
import dotenv from 'dotenv';
dotenv.config();

const CONCURRENCY_LIMIT = 5;

type Question = {
  number: number;
  text: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
};

async function runBatch() {
  const inputPath = path.join(__dirname, '../data/questions.json');
  const outputPath = path.join(__dirname, '../data/results.json');

  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const questions: Question[] = JSON.parse(rawData);

  const results: any[] = [];

  for (let i = 0; i < questions.length; i += CONCURRENCY_LIMIT) {
    const chunk = questions.slice(i, i + CONCURRENCY_LIMIT);
    console.log(`⚙️ Processing questions ${chunk.map(q => q.number).join(', ')}`);

    const promises = chunk.map(async (question) => {
      try {
        const response = await runAgent(question.text, question.choices);
        return {
          number: question.number,
          question: question.text,
          choices: question.choices,
          response
        };
      } catch (err) {
        console.error(`❌ Error on question ${question.number}:`, err);
        return {
          number: question.number,
          error: true,
          message: String(err)
        };
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ Results saved to ${outputPath}`);
}

runBatch();
