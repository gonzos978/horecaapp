import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../fb/firebase";

export interface ScoringConfig {
    passPercent: number;              // min % to pass a test (default 70)
    excellentThreshold: number;       // % for "Odlično" badge (default 90)
    goodThreshold: number;            // % for "Dobro" badge (default 70)
    shiftScoreGreen: number;          // shift checklist % for green (default 90)
    shiftScoreAmber: number;          // shift checklist % for amber (default 50)
    testRetryHours: number;           // hours before retaking a test (default 24)
    checklistMinIntervalMinutes: number; // min minutes between checklist submissions (default 0)
    pointsPerCorrect: number;         // XP points per correct answer (default 10)
    bonusOnExcellent: number;         // bonus XP if score >= excellentThreshold (default 50)
}

export const DEFAULT_SCORING: ScoringConfig = {
    passPercent:                 70,
    excellentThreshold:          90,
    goodThreshold:               70,
    shiftScoreGreen:             90,
    shiftScoreAmber:             50,
    testRetryHours:              24,
    checklistMinIntervalMinutes: 0,
    pointsPerCorrect:            10,
    bonusOnExcellent:            50,
};

export function useScoringConfig(customerId: string | undefined): ScoringConfig {
    const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING);

    useEffect(() => {
        if (!customerId) return;
        getDoc(doc(db, "settings", customerId)).then(snap => {
            if (snap.exists() && snap.data().scoring) {
                setConfig({ ...DEFAULT_SCORING, ...snap.data().scoring });
            }
        });
    }, [customerId]);

    return config;
}
