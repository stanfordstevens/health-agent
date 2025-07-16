import OpenAI from 'openai';
import dotenv from 'dotenv';
import { retrieveRelevantCodesFromChoices } from './retrieveRelevantCodes';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent(
  question: string,
  choices?: Record<string, string>
): Promise<string> {
  let codeContext = '';
  if (choices) {
    const topCodes = retrieveRelevantCodesFromChoices(choices as any);
    codeContext = topCodes
      .map((entry, idx) => `${idx + 1}. ${entry.code} – ${entry.description}`)
      .join('\n');
  }

  const formattedChoices = choices
    ? Object.entries(choices).map(([key, val]) => `${key}. ${val}`).join('\n')
    : '';

  const prompt = `
You are a medical coding expert. You are answering multiple-choice questions. 
Some questions are about CPT, ICD, or HCPCS codes. Other questions are general health knowledge.

Question:
${question}

Choices:
${formattedChoices}

Relevant Codes (only included for code-related questions):
${codeContext}

Instructions:
1. For all questions:
    - Unless explicitly stated in the question, assume a patient is older than 4 years old.
    - Unless explicitly stated in the question, assume a patient is new when asked about medical history.
    - If a patient is there for an annual checkup, this does NOT mean that they are assumed to be established, they can be new.
    - Always select the single best answer from the provided choices (A, B, C, or D).
    - The letter you provide after "Answer:" must match the reasoning. Double check your mapping.
2. If the question is about medical codes:
   - Use only the information in the "Relevant Codes" section to determine the best match.
   - Only reference a code in the "Relevant Codes" section.
   - Do NOT rely on outside knowledge or invent codes not listed.
   - Match the scenario to the code descriptions, then map the correct code to its corresponding letter.
3. If the question is about coding guidelines or general health knowledge (and not about a specific code):
   - Ignore the "Relevant Codes" section.
   - Use official coding conventions and medical knowledge.
   - Example guideline: If a condition is both acute and chronic with separate subentries in the alphabetic index, sequence the acute condition first.
4. Return your answer strictly in this format:
   Answer: <LETTER>
   Explanation: <reasoning>

Be careful: double-check that the letter you provide matches the correct choice.
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
