import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

async function generateQuizFromText(text: string) {
    // Placeholder for Gemini logic
    return [
        {
            question: "Sample question from PDF",
            options: ["A", "B", "C", "D"],
            answer: "A",
        },
    ];
}

export const createQuizFromPdf = onCall({ cors: true },async (request) => {
    // 1️⃣ Check Authentication (v2 style: request.auth)
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in");
    }

    // 2️⃣ Access data (v2 style: request.data)
    const { documentId } = request.data;
    if (!documentId) {
        throw new HttpsError("invalid-argument", "Missing documentId");
    }

    try {
        // 3️⃣ Lazy-load heavy PDF library
        const pdf = await import("pdf-parse");
        const pdfParse = (pdf as any).default || pdf;

        // 4️⃣ Get document metadata from Firestore
        const docSnap = await db.collection("documents").doc(documentId).get();
        const docData = docSnap.data();

        if (!docSnap.exists || !docData) {
            throw new HttpsError("not-found", "Document not found");
        }

        // 5️⃣ Download PDF (Node 22 native fetch)
        const pdfResponse = await fetch(docData.fileUrl);
        if (!pdfResponse.ok) throw new Error("Failed to download PDF");

        const arrayBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 6️⃣ Extract text
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text;

        // 7️⃣ Generate quiz
        const quiz = await generateQuizFromText(text);

        // 8️⃣ Save to Firestore
        await db.collection("quizzes").add({
            documentId,
            title: docData.fileName || "Untitled Quiz",
            questions: quiz,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isPublic: true,
            userId: request.auth.uid
        });

        return { success: true };
    } catch (error: any) {
        console.error("Quiz Generation Error:", error);
        throw new HttpsError("internal", error.message || "An error occurred");
    }
});