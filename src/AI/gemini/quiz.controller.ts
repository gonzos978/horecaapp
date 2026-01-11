import {generateQuiz} from "./gemini.quiz.ts";
import {chunkText, cleanText} from "../../utils/text.ts";
import {extractPdfText} from "../../utils/pdf.ts";


export async function generateQuizFromPdf(req, res) {
    try {
        const pdfPath = req.file.path;

        const text = await extractPdfText(pdfPath);
        const cleaned = cleanText(text);
        const chunks = chunkText(cleaned);

        const questions = [];

        for (const chunk of chunks) {
            const quiz = await generateQuiz(chunk, 3);
            questions.push(...quiz.questions);
        }

        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
