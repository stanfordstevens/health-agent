import fs from 'fs';
import path from 'path';

type CodeEntry = {
  code: string;
  type: string;
  description: string;
};

type Choices = {
  A: string;
  B: string;
  C: string;
  D: string;
};

export function retrieveRelevantCodesFromChoices(choices: Choices): CodeEntry[] {
  const dataFile = path.join(__dirname, '../data/health_codes.json'); // or your raw codes file if preferred
  const rawData = fs.readFileSync(dataFile, 'utf-8');
  const allCodes: CodeEntry[] = JSON.parse(rawData);

  const choiceCodes = new Set(Object.values(choices).map(c => c.trim()));

  const relevant = allCodes.filter(entry => choiceCodes.has(entry.code.trim()));

  // In case any code is missing from dataset, log it for debugging
  const missing = [...choiceCodes].filter(c => !relevant.find(r => r.code.trim() === c));
  if (missing.length > 0) {
    console.warn(`⚠️ Missing descriptions for codes: ${missing.join(', ')}`);
  }

  return relevant;
}