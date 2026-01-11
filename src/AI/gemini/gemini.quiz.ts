import { geminiModel } from "./GeminiAPI";
import { quizPrompt } from "./gemini.prompts";
import { QuizResult } from "./gemini.types";

export async function generateQuiz(
    text: string,
    questionCount = 5
): Promise<QuizResult> {

    const prompt = quizPrompt(text, questionCount);

    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text();

    try {
        return JSON.parse(raw) as QuizResult;
    } catch {
        console.error("Gemini invalid JSON:", raw);
        throw new Error("Failed to parse Gemini response");
    }
}
