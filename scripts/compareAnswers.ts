import fs from 'fs';
import path from 'path';

type AgentResult = {
  number: number;
  response: string;
};

type AnswerKeyEntry = {
  number: number;
  answer: string;
};

function extractAnswerLetter(response: string): string | null {
  const match = response.match(/Answer:\s*([A-D])/i);
  return match ? match[1].toUpperCase() : null;
}

function compareAnswers(resultsPath: string, answersPath: string, outputPath: string) {
  const resultsData: AgentResult[] = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const answerKey: AnswerKeyEntry[] = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

  const answerMap = new Map<number, string>();
  for (const entry of answerKey) {
    answerMap.set(entry.number, entry.answer.toUpperCase());
  }

  let correct = 0;
  const comparisons = resultsData.map(result => {
    const predicted = extractAnswerLetter(result.response);
    const expected = answerMap.get(result.number);
    const isCorrect = predicted === expected;
    if (isCorrect) correct++;
    return {
      number: result.number,
      predicted,
      expected,
      correct: isCorrect
    };
  });

  const accuracy = (correct / comparisons.length) * 100;
  const output = {
    accuracy: `${accuracy.toFixed(2)}%`,
    correct,
    total: comparisons.length,
    results: comparisons
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Comparison complete. Accuracy: ${output.accuracy}`);
}

// Example usage:
compareAnswers(
  path.join(__dirname, '../data/results.json'),
  path.join(__dirname, '../data/answers.json'),
  path.join(__dirname, '../data/accuracy_report.json')
);
