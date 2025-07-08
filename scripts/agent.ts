import OpenAI from 'openai';
import dotenv from 'dotenv';
import { retrieveRelevantCodes, EmbeddedHealthCode } from './retrieveRelevantCodes';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent(
  question: string,
  choices?: Record<string, string>
): Promise<string> {
  const topCodes: EmbeddedHealthCode[] = await retrieveRelevantCodes(question, 5);

  const codeContext = topCodes
    .map((entry, idx) => `${idx + 1}. ${entry.code} – ${entry.description}`)
    .join('\n');

  const formattedChoices = choices
    ? Object.entries(choices).map(([key, val]) => `${key}. ${val}`).join('\n')
    : '';

  const prompt = `
You are a medical coding expert. Given a clinical scenario, multiple choice options, and a list of relevant CPT/ICD/HCPCS codes, choose the correct option and explain your reasoning.

Question:
${question}

Choices:
${formattedChoices}

Relevant Codes:
${codeContext}

Instructions:
1. Match the question to the correct code.
2. Eliminate incorrect options.
3. Return only the correct letter and a brief explanation.

Respond in this format:
Answer: <LETTER>
Explanation: <your reasoning>
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a precise and reliable medical coder.',
      },
      {
        role: 'user',
        content: prompt,
      }
    ],
    temperature: 0.2,
  });

  return completion.choices[0].message.content ?? '';
}