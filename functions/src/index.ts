import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {onObjectFinalized} from "firebase-functions/storage";
import {getStorage} from "firebase-admin/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {getFirestore} from "firebase-admin/firestore";
import { VertexAI } from "@google-cloud/vertexai";


if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const GEMINI_KEY = process.env.GEMINI_API_KEY || "AIzaSyAuweguPGysCbQFhctYt5UI8YAzxaYzdtI";
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

async function getRequester(uid: string) {
    const snap = await db.collection("users").doc(uid).get();

    if (!snap.exists) return null;

    return snap.data();
}


/**
 * =========================================================
 * CREATE CUSTOMER
 * =========================================================
 */

export const createCustomer = onRequest(
    { cors: true, invoker: "public", timeoutSeconds: 60, memory: "512MiB" },
    async (req, res) => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.status(204).send("");
            return;
        }

        res.set("Access-Control-Allow-Origin", "*");

        try {
            // Verify Firebase ID token
            const authHeader = req.headers.authorization || "";
            const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
            if (!token) { res.status(401).json({ error: "Unauthenticated" }); return; }

            const decoded = await admin.auth().verifyIdToken(token);
            const uid = decoded.uid;
            const requester = await getRequester(uid);

            if (!requester || requester.type !== "SUPER_ADMIN") {
                res.status(403).json({ error: "Only super admins allowed" });
                return;
            }

            const {
                customerName, businessType, locationName, locationId,
                address, city, country, contactFirstName, contactLastName,
                phone, email, website, gps, capacity, notes, adminName, adminEmail, adminPassword,
            } = req.body;

            if (!customerName || !adminEmail || !adminPassword) {
                res.status(400).json({ error: "Missing required fields" });
                return;
            }

            const customerRef = db.collection("customers").doc();
            const customerId = customerRef.id;

            const userRecord = await admin.auth().createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: adminName || customerName,
            });

            const managerData = {
                uid: userRecord.uid,
                customerId,
                customerName,
                businessType,
                name: adminName || "",
                email: adminEmail,
                role: "CUSTOMER",
                isAdmin: true,
                createdAt: new Date().toISOString(),
            };

            const batch = db.batch();

            batch.set(customerRef, {
                id: customerId,
                customerName,
                businessType: businessType || "",
                locationName: locationName || "",
                locationId: locationId || null,
                address: address || "",
                city: city || "",
                country: country || "",
                contactFirstName: contactFirstName || "",
                contactLastName: contactLastName || "",
                phone: phone || "",
                email: email || "",
                website: website || "",
                gps: gps || null,
                capacity: capacity || null,
                notes: notes || "",
                status: "ACTIVE",
                plan: "FREE",
                createdAt: new Date().toISOString(),
                createdBy: uid,
            });

            batch.set(
                db.collection("customers").doc(customerId).collection("managers").doc(userRecord.uid),
                managerData
            );
            batch.set(db.collection("users").doc(userRecord.uid), managerData);

            await batch.commit();

            res.status(200).json({ success: true, customerId, managerUid: userRecord.uid });
        } catch (error: any) {
            console.error("createCustomer error:", error);
            if (error.code === "auth/email-already-exists") {
                res.status(409).json({ error: "Email already exists" });
                return;
            }
            res.status(500).json({ error: error?.message || "Failed to create customer" });
        }
    }
);

/**
 * =========================================================
 * CREATE WORKER (called by manager from PWA)
 * Uses Admin SDK — bypasses Firestore security rules entirely.
 * =========================================================
 */
export const createWorker = onCall(
    { cors: true, invoker: "public", timeoutSeconds: 60, memory: "256MiB" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Login required");
        }

        const requester = await getRequester(request.auth.uid);
        if (!requester) {
            throw new HttpsError("permission-denied", "Requester not found");
        }

        const requesterRole: string = (requester.role ?? "").toLowerCase();
        if (!["manager", "customer", "admin"].includes(requesterRole) && requester.type !== "SUPER_ADMIN") {
            throw new HttpsError("permission-denied", "Only managers or customers can create workers");
        }

        const { name, email, password, phone, address, type } = request.data || {};

        if (!name || !email || !password) {
            throw new HttpsError("invalid-argument", "name, email and password are required");
        }

        // Derive role from position type
        const MANAGER_TYPES = ["hotel_manager", "restaurant_manager", "manager"];
        const newRole = MANAGER_TYPES.includes(type ?? "") ? "manager" : "worker";

        try {
            // 1. Create Firebase Auth account (admin SDK — doesn't sign out the caller)
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });

            // 2. Build Firestore doc with all defaults
            const now = admin.firestore.FieldValue.serverTimestamp();
            const userData: Record<string, any> = {
                uid: userRecord.uid,
                name,
                email,
                phone: phone ?? "",
                address: address ?? "",
                type: type ?? "waiter",
                role: newRole,
                isAdmin: false,
                customerId: requester.customerId ?? null,
                customerName: requester.customerName ?? null,
                createdAt: now,
                active: true,
                training: false,
                trainingScore: 0,
                workerStats: {
                    overallScore: 0,
                    lastShiftScore: 0,
                    lastShiftDate: null,
                    shiftsCount: 0,
                    recentScores: [],
                    updatedAt: now,
                },
            };

            // 3. Write to users collection keyed by Firebase Auth UID
            await db.collection("users").doc(userRecord.uid).set(userData);

            return { success: true, uid: userRecord.uid };

        } catch (error: any) {
            console.error("createWorker error:", error);

            if (error.code === "auth/email-already-exists") {
                throw new HttpsError("already-exists", "Email already in use");
            }
            if (error instanceof HttpsError) throw error;
            throw new HttpsError("internal", error?.message || "Failed to create worker");
        }
    }
);

/**
 * DELETE WORKER
 */
export const deleteWorker = onCall(
    { cors: true, invoker: "public", timeoutSeconds: 60, memory: "256MiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

        const requester = await getRequester(request.auth.uid);
        if (!requester) throw new HttpsError("permission-denied", "Requester not found");

        const requesterRole = (requester.role ?? "").toLowerCase();
        if (!["manager", "customer", "admin"].includes(requesterRole) && requester.type !== "SUPER_ADMIN") {
            throw new HttpsError("permission-denied", "Only managers or customers can delete workers");
        }

        const { email, uid } = request.data || {};
        if (!uid && !email) throw new HttpsError("invalid-argument", "uid or email is required");

        try {
            // Delete Firestore doc — new workers keyed by uid, old ones by email
            if (uid) {
                await db.collection("users").doc(uid).delete();
                // Also try email-keyed doc for old workers
                if (email) {
                    try { await db.collection("users").doc(email).delete(); } catch (_) {}
                }
            } else {
                await db.collection("users").doc(email).delete();
            }

            // Delete Firebase Auth account
            if (uid) {
                try { await admin.auth().deleteUser(uid); } catch (_) {}
            } else if (email) {
                try {
                    const authUser = await admin.auth().getUserByEmail(email);
                    await admin.auth().deleteUser(authUser.uid);
                } catch (_) {}
            }

            return { success: true };
        } catch (error: any) {
            if (error instanceof HttpsError) throw error;
            throw new HttpsError("internal", error?.message || "Failed to delete worker");
        }
    }
);

/**
 * DELETE CUSTOMER
 */
export const deleteCustomerUser = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Login required");
    }

    const uid = request.auth.uid;
    const requester = await getRequester(uid);

    if (!requester || requester.type !== "SUPER_ADMIN") {
        throw new HttpsError("permission-denied", "Only super admin allowed");
    }

    const { userId, customerId } = request.data;

    if (!userId) {
        throw new HttpsError("invalid-argument", "Missing userId");
    }

    try {
        const batch = db.batch();

        // 1️⃣ delete user document
        batch.delete(db.collection("users").doc(userId));

        // 2️⃣ delete customer document
        if (customerId) {
            batch.delete(db.collection("customers").doc(customerId));
        }

        await batch.commit();

        // 3️⃣ delete auth user (IMPORTANT)
        await admin.auth().deleteUser(userId);

        return { success: true };

    } catch (err: any) {
        console.error("DELETE ERROR:", err);

        throw new HttpsError(
            "internal",
            err?.message || "Failed to delete customer"
        );
    }
});

/**
 * =========================================================
 * DELETE USER
 * =========================================================
 */

export const deleteUser = onCall(
    async (request) => {
        // 1. Inline Auth Check (Fixes TS18048 completely)
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "User must be logged in"
            );
        }

        const uid = request.auth.uid;
        const { uid: targetUid, customerId } = request.data || {};

        if (!targetUid) {
            throw new HttpsError(
                "invalid-argument",
                "Target user UID is required"
            );
        }

        /**
         * ⚠️ PREVENT SELF DELETE (Moved outside try-catch)
         */
        if (targetUid === uid) {
            throw new HttpsError(
                "failed-precondition",
                "You cannot delete yourself"
            );
        }

        const requester = await getRequester(uid);

        if (!requester) {
            throw new HttpsError(
                "permission-denied",
                "User not found"
            );
        }

        const isSuperAdmin = requester.type === "SUPER_ADMIN";
        const isCustomerAdmin =
            requester.customerId === customerId &&
            requester.isAdmin === true;

        if (!isSuperAdmin && !isCustomerAdmin) {
            throw new HttpsError(
                "permission-denied",
                "Not allowed"
            );
        }

        try {
            /**
             * 🧨 DELETE AUTH USER
             */
            await admin.auth().deleteUser(targetUid);

            /**
             * ⚡ BATCH DELETE FIRESTORE
             */
            const batch = db.batch();

            batch.delete(
                db.collection("users").doc(targetUid)
            );

            if (customerId) {
                batch.delete(
                    db
                        .collection("customers")
                        .doc(customerId)
                        .collection("managers")
                        .doc(targetUid)
                );
            }

            await batch.commit();

            return {
                success: true,
            };

        } catch (error: any) {
            console.error("Delete User Error:", error);

            if (error instanceof HttpsError) throw error;

            throw new HttpsError(
                "internal",
                error?.message || "Failed to delete user"
            );
        }
    }
);

/**
 * =========================================================
 * GENERATE QUESTIONS (callable)
 * Downloads a training PDF from Storage, extracts its text,
 * and asks Gemini for multiple-choice questions. Returns the
 * questions to the caller (CreateTest previews before saving).
 * =========================================================
 */

export const generateQuestions = onCall(
    {
        cors: true,
        invoker: "public",
        timeoutSeconds: 120,
        memory: "1GiB",
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be logged in");
        }

        const { role, roleContext, pdfPath, count } = request.data || {};

        if (!role || !pdfPath) {
            throw new HttpsError(
                "invalid-argument",
                "role and pdfPath are required"
            );
        }

        const numQuestions = Math.min(Math.max(Number(count) || 5, 1), 50);

        try {
            // 1. Download PDF from Storage (admin SDK, explicit bucket)
            console.log(`generateQuestions: downloading ${pdfPath}`);
            const bucket = getStorage().bucket("horecaapp-e16cf.firebasestorage.app");
            const [buffer] = await bucket.file(pdfPath).download();
            console.log(`generateQuestions: downloaded ${buffer.length} bytes`);

            // 2. Extract text
            console.log("generateQuestions: extracting text from PDF");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require("pdf-parse");
            const data = await pdfParse(buffer);
            const text = (data.text || "").trim();
            console.log(`generateQuestions: extracted ${text.length} chars`);

            if (!text) {
                throw new HttpsError(
                    "failed-precondition",
                    "Could not extract any text from the PDF"
                );
            }

            // 3. Generate questions with Gemini (JSON response)
            console.log(`generateQuestions: calling Gemini for ${numQuestions} questions`);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" },
            });

            const prompt = `You are creating a multiple-choice training test for a hospitality "${role}" role.
Role focus: ${roleContext || role}.
Based ONLY on the training document text below, write ${numQuestions} multiple-choice questions.
Each question must have exactly 4 options, exactly one correct answer, and a short explanation.
Return ONLY valid JSON in this exact shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}
Where "correct" is the zero-based index (0-3) of the correct option.

Training document:
"""
${text.slice(0, 30000)}
"""`;

            const result = await model.generateContent(prompt);
            const raw = result.response.text();

            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch {
                // Strip markdown fences if the model wrapped the JSON
                const cleaned = raw.replace(/```json|```/g, "").trim();
                parsed = JSON.parse(cleaned);
            }

            const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

            if (!Array.isArray(rawQuestions)) {
                throw new HttpsError(
                    "internal",
                    "AI returned an unexpected format"
                );
            }

            // Validate each question against the expected schema
            const isValidQuestion = (q: any): boolean =>
                q !== null &&
                typeof q === "object" &&
                typeof q.question === "string" && q.question.trim() !== "" &&
                Array.isArray(q.options) &&
                q.options.length === 4 &&
                q.options.every((o: any) => typeof o === "string") &&
                typeof q.correct === "number" &&
                Number.isInteger(q.correct) &&
                q.correct >= 0 && q.correct <= 3 &&
                typeof q.explanation === "string";

            const questions = rawQuestions.filter(isValidQuestion);

            if (questions.length === 0) {
                throw new HttpsError(
                    "internal",
                    "AI returned no valid questions — try again"
                );
            }

            if (questions.length < rawQuestions.length) {
                console.warn(
                    `generateQuestions: dropped ${rawQuestions.length - questions.length} malformed question(s)`
                );
            }

            return { questions };
        } catch (error: any) {
            console.error("generateQuestions error:", error);

            if (error instanceof HttpsError) throw error;

            // Surface the real message so the client can display it
            throw new HttpsError(
                "internal",
                `generateQuestions failed: ${error?.message ?? String(error)}`
            );
        }
    }
);

/**
 * CREATE TEST
 */

export const generateTestFromPDF = onObjectFinalized({
    cpu: 2,
    memory: "1GiB",
    bucket: "horecaapp-e16cf.firebasestorage.app",
}, async (event) => {
    const filePath = event.data.name; // e.g., "pdfs/lesson1.pdf"

    // 1. Only process files in the 'tests' folder
    if (!filePath.startsWith("tests/")) return;

    const bucket = getStorage().bucket(event.data.bucket);
    const file = bucket.file(filePath);

    try {
        // 2. Download PDF into memory
        const [buffer] = await file.download();

        // 3. Extract Text
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        const extractedText = data.text;

        // 4. Send to AI Agent
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Based on the following text, create a 5-question multiple choice test.
                        Return the result in valid JSON format:
                        [{ "question": "...", "options": ["A", "B", "C"], "answer": "A" }]
                        Text: ${extractedText}`;

        const result = await model.generateContent(prompt);
        const testJson = JSON.parse(result.response.text());

        // 5. Save to Firestore
        await getFirestore().collection("generated_tests").add({
            sourceFile: filePath,
            questions: testJson,
            createdAt: new Date().toISOString()
        });

        console.log("Test generated successfully!");

    } catch (error) {
        console.error("AI Generation Error:", error);
    }
});

// =========================================================
// ANA CHAT — Gemini-powered AI assistant
// =========================================================
const ANA_SYSTEM = `Ti si Ana, AI asistent za Smarter HoReCa platformu — vodeće rješenje za upravljanje hotelima, restoranima, kaféima i cateringom u regiji.
Pomažeš menadžerima i vlasnicima ugostiteljskih objekata sa: upravljanjem osobljem, smjenama, godišnjim odmorima, obukama, inventarom, menijima i anonimnim prijavama.
Uvijek odgovaraj ljubazno, profesionalno i kratko. Odgovaraj na istom jeziku kojim ti se korisnik obraća.`;

const vertexAI = new VertexAI({ project: "horecaapp-e16cf", location: "us-central1" });

export const anaChat = onCall({ cors: true, invoker: "public" }, async (request) => {
    const { message, history } = request.data as {
        message: string;
        history: { role: string; text: string }[];
    };

    if (!message?.trim()) throw new HttpsError("invalid-argument", "Message is required");

    try {
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: { role: "system", parts: [{ text: ANA_SYSTEM }] },
        });

        const chat = model.startChat({
            history: (history ?? []).map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.text }],
            })),
        });

        const result = await chat.sendMessage([{ text: message }]);
        const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nema odgovora.";
        return { reply };
    } catch (err: any) {
        console.error("anaChat error:", err?.message ?? err);
        throw new HttpsError("internal", err?.message ?? "Gemini error");
    }
});
