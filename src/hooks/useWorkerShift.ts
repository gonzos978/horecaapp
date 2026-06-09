import { useState, useEffect } from "react";
import {
    collection, query, where, getDocs, addDoc,
    updateDoc, doc, serverTimestamp, Timestamp, setDoc
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface WorkerShift {
    id: string;
    workerId: string;
    workerName: string;
    workerType: string;
    customerId: string;
    customerName: string;
    date: string;
    startTime: Timestamp;
    endTime: Timestamp | null;
    status: "active" | "completed";
    endNotes: string;
}

export function useWorkerShift() {
    const { user, currentUser } = useAuth();
    const [activeShift, setActiveShift] = useState<WorkerShift | null>(null);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split("T")[0];

    // Fetch today's active shift for this worker
    const fetchActiveShift = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            // Single-field query avoids composite index requirement
            const q = query(
                collection(db, "shifts"),
                where("workerId", "==", user.uid),
                where("status", "==", "active")
            );
            const snap = await getDocs(q);
            // Filter client-side for today's date
            const todayDoc = snap.docs.find(d => d.data().date === today);
            if (todayDoc) {
                setActiveShift({ id: todayDoc.id, ...todayDoc.data() } as WorkerShift);
            } else {
                setActiveShift(null);
            }
        } catch (err) {
            console.error("useWorkerShift fetchActiveShift:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveShift();
    }, [user?.uid]);

    // Start a new shift
    const startShift = async (): Promise<WorkerShift> => {
        if (!user?.uid || !currentUser) throw new Error("Not authenticated");

        const payload = {
            workerId: user.uid,
            workerName: currentUser.name ?? "",
            workerType: currentUser.type ?? "",
            customerId: currentUser.customerId ?? "",
            customerName: currentUser.customerName ?? "",
            date: today,
            startTime: serverTimestamp(),
            endTime: null,
            status: "active" as const,
            endNotes: "",
        };

        const ref = await addDoc(collection(db, "shifts"), payload);
        const shift = { id: ref.id, ...payload, startTime: Timestamp.now() } as WorkerShift;
        setActiveShift(shift);
        return shift;
    };

    // End the active shift
    const endShift = async (notes: string) => {
        if (!activeShift) throw new Error("No active shift");
        await updateDoc(doc(db, "shifts", activeShift.id), {
            endTime: serverTimestamp(),
            status: "completed",
            endNotes: notes,
        });
        setActiveShift(null);
    };

    // Log a generic action to the shift's actions subcollection
    const logAction = async (type: string, data: Record<string, unknown>) => {
        if (!activeShift) return;
        await addDoc(collection(db, "shifts", activeShift.id, "actions"), {
            type,
            data,
            workerId: user?.uid,
            createdAt: serverTimestamp(),
        });
    };

    // Save a completed checklist snapshot to shifts/{shiftId}/checklists/{checklistId}
    const submitChecklist = async (payload: {
        checklistId: string;
        checklistTitle: string;
        timePeriod: string;
        items: { itemId: string; text: string; completed: boolean }[];
    }) => {
        if (!activeShift) throw new Error("No active shift");
        await setDoc(
            doc(db, "shifts", activeShift.id, "checklists", payload.checklistId),
            {
                shiftId: activeShift.id,
                checklistId: payload.checklistId,
                checklistTitle: payload.checklistTitle,
                timePeriod: payload.timePeriod,
                items: payload.items,
                submittedAt: serverTimestamp(),
                workerId: user?.uid,
                workerName: activeShift.workerName,
                workerType: activeShift.workerType,
                customerId: activeShift.customerId,
                date: activeShift.date,
            }
        );
    };

    return { activeShift, loading, startShift, endShift, logAction, submitChecklist, refetch: fetchActiveShift };
}
