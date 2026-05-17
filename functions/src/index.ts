import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

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

export const createCustomer = onCall(
    {
        cors: true,
        timeoutSeconds: 60,
        memory: "512MiB",
    },



    async (request) => {
        console.log("FUNCTION HIT");
        // 1. Inline Auth Check (Fixes TS18048 completely)
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "User must be logged in"
            );
        }
        console.log("createCustomer.....");
        const uid = request.auth.uid;
        const requester = await getRequester(uid);

        if (!requester) {
            throw new HttpsError(
                "permission-denied",
                "User not found"
            );
        }
        console.log("ROLE: ", requester.type)
        if (requester.type !== "SUPER_ADMIN") {
            throw new HttpsError(
                "permission-denied",
                "Only super admins allowed"
            );
        }

        // Added fallback empty object to protect against destructuring undefined
        const {
            customerName,
            address,
            phone,
            adminName,
            adminEmail,
            adminPassword,
        } = request.data || {};

        if (
            !customerName ||
            !adminEmail ||
            !adminPassword
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Missing required fields"
            );
        }

        try {
            /**
             * 🔥 CUSTOMER ID
             */
            const customerRef = db.collection("customers").doc();
            const customerId = customerRef.id;

            /**
             * 👤 CREATE AUTH USER (MANAGER)
             */
            const userRecord = await admin.auth().createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: adminName || "",
            });

            /**
             * 🧠 MANAGER DATA
             */
            const managerData = {
                uid: userRecord.uid,
                customerId,
                customerName,
                name: adminName || "",
                email: adminEmail,
                role: "CUSTOMER",
                isAdmin: true,
                createdAt: new Date().toISOString(),
            };

            /**
             * ⚡ BATCH WRITE
             */
            const batch = db.batch();

            batch.set(customerRef, {
                id: customerId,
                customerName,
                address: address || "",
                phone: phone || "",
                status: "ACTIVE",
                plan: "FREE",
                createdAt: new Date().toISOString(),
                createdBy: uid,
            });

            batch.set(
                db
                    .collection("customers")
                    .doc(customerId)
                    .collection("managers")
                    .doc(userRecord.uid),
                managerData
            );

            batch.set(
                db.collection("users").doc(userRecord.uid),
                managerData
            );

            await batch.commit();

            return {
                success: true,
                customerId,
                managerUid: userRecord.uid,
            };

        } catch (error: any) {
            console.error("Create Customer Error:", error);

            if (error.code === "auth/email-already-exists") {
                throw new HttpsError(
                    "already-exists",
                    "Email already exists"
                );
            }

            // Fallthrough security: Ensure custom errors aren't masked as 500s
            if (error instanceof HttpsError) throw error;

            throw new HttpsError(
                "internal",
                error?.message || "Failed to create customer"
            );
        }
    }
);

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