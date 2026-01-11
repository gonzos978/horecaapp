export function quizPrompt(text: string, questionCount = 5) {
    return `
You are an educational quiz generator.

Rules:
- Use ONLY the provided text
- No outside knowledge
- Output valid JSON ONLY
- No markdown
- No explanations

Create ${questionCount} multiple-choice questions.

JSON format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}

TEXT:
"""
${text}
"""
`;
}
