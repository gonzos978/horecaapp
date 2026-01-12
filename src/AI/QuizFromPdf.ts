import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

import { extractPdfText } from "./utils/pdf";

import { generateQuiz } from "./services/gemini.quiz";

admin.initializeApp();

const db = admin.firestore();

export const createQuizFromPdf = functions.https.onCall(
    async (data, context) => {

        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "User must be authenticated"
            );
        }

        const { documentId } = data;
        const userId = context.auth.uid;

        if (!documentId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "documentId is required"
            );
        }

        // 1. Get document
        const docSnap = await db.collection("documents").doc(documentId).get();
        if (!docSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Document not found");
        }

        const docData = docSnap.data()!;
        if (docData.ownerId !== userId) {
            throw new functions.https.HttpsError("permission-denied", "Not your document");
        }

        // 2. Download PDF
        const response = await fetch(docData.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // 3. Extract text
        const text = await extractPdfText(buffer);
        const chunks = chunkText(cleanText(text)).slice(0, 3);

        // 4. Generate quiz
        const questions: any[] = [];
        for (const chunk of chunks) {
            const quiz = await generateQuiz(chunk, 3);
            questions.push(...quiz.questions);
        }

        // 5. Save quiz
        await db.collection("quizzes").add({
            documentId,
            ownerId: userId,
            title: docData.fileName,
            questions,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: "pdf",
        });

        return { success: true };
    }
);
