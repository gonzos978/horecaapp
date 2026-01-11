import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
}

export const geminiClient = new GoogleGenerativeAI(apiKey);

export const geminiModel = geminiClient.getGenerativeModel({
    model: "gemini-1.5-pro",
});
