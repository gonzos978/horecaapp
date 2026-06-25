import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../fb/firebase';

interface EligibilityResult {
  loading: boolean;
  eligible: boolean;
  shiftsCount: number;
  overallScore: number;
  // How many shifts / score points still needed
  shiftsNeeded: number;
  scoreNeeded: number;
}

const MIN_SHIFTS = 15;
const MIN_SCORE  = 70;

export function useWorkerEligibility(email: string | undefined): EligibilityResult {
  const [loading, setLoading] = useState(true);
  const [shiftsCount, setShiftsCount] = useState(0);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (!email) { setLoading(false); return; }

    getDocs(query(collection(db, 'users'), where('email', '==', email))).then((snap) => {
      const stats = snap.docs[0]?.data()?.workerStats ?? {};
      setShiftsCount(stats.shiftsCount ?? 0);
      setOverallScore(stats.overallScore ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [email]);

  const eligible      = shiftsCount >= MIN_SHIFTS && overallScore >= MIN_SCORE;
  const shiftsNeeded  = Math.max(0, MIN_SHIFTS - shiftsCount);
  const scoreNeeded   = Math.max(0, MIN_SCORE - overallScore);

  return { loading, eligible, shiftsCount, overallScore, shiftsNeeded, scoreNeeded };
}
