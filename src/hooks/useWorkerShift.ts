import { useState, useEffect } from "react";
import {
    collection, query, where, getDocs, addDoc,
    updateDoc, doc, serverTimestamp, Timestamp, setDoc, onSnapshot
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
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    // Real-time listener for today's active shift
    useEffect(() => {
        if (!user?.uid) {
            setActiveShift(null);
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, "shifts"),
            where("workerId", "==", user.uid),
            where("status", "==", "active")
        );

        const unsub = onSnapshot(q, (snap) => {
            const todayDoc = snap.docs.find(d => d.data().date === today);
            setActiveShift(todayDoc ? { id: todayDoc.id, ...todayDoc.data() } as WorkerShift : null);
            setLoading(false);
        }, (err) => {
            console.error("useWorkerShift onSnapshot:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user?.uid]);

    const fetchActiveShift = async () => {
        if (!user?.uid) return;
        const q = query(
            collection(db, "shifts"),
            where("workerId", "==", user.uid),
            where("status", "==", "active")
        );
        const snap = await getDocs(q);
        const todayDoc = snap.docs.find(d => d.data().date === today);
        setActiveShift(todayDoc ? { id: todayDoc.id, ...todayDoc.data() } as WorkerShift : null);
    };

    // Start a new shift
    const startShift = async (): Promise<WorkerShift> => {
        if (!user?.uid || !currentUser) throw new Error("Not authenticated");

        // Try to get geolocation (best-effort, won't block shift start)
        let geoLocation: { lat: number; lng: number; accuracy: number } | null = null;
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
            );
            geoLocation = {
                lat:      pos.coords.latitude,
                lng:      pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy),
            };
        } catch {
            // Permission denied or unavailable — continue without location
        }

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
            ...(geoLocation ? { startLocation: geoLocation } : {}),
        };

        const ref = await addDoc(collection(db, "shifts"), payload);
        const shift = { id: ref.id, ...payload, startTime: Timestamp.now() } as WorkerShift;
        setActiveShift(shift);
        return shift;
    };

    // End the active shift — requires at least 8 hours since start
    const endShift = async (notes: string) => {
        if (!activeShift) throw new Error("No active shift");

        const startMs = activeShift.startTime?.toMillis?.() ?? activeShift.startTime?.seconds * 1000;
        const elapsedMs = Date.now() - startMs;
        const MIN_SHIFT_MS = 8 * 60 * 60 * 1000;

        if (elapsedMs < MIN_SHIFT_MS) {
            const remainingMs = MIN_SHIFT_MS - elapsedMs;
            const h = Math.floor(remainingMs / 3600000);
            const m = Math.ceil((remainingMs % 3600000) / 60000);
            throw new Error(`MIN_SHIFT_HOURS:${h}:${m}`);
        }

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
