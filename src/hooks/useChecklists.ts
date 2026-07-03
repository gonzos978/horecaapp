import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../fb/firebase';
import { useWorkerShift } from './useWorkerShift';

export interface CheckItem {
  id: string;
  text: string;
  order: number;
  completed: boolean;
}

export interface ChecklistZone {
  id: string;
  title: string;
  items: CheckItem[];
}

export interface Checklist {
  id: string;
  title: string;
  timePeriod: string;
  zones: ChecklistZone[];
}

const TIME_ORDER: Record<string, number> = {
  'start shift': 0,
  'during shift': 1,
  'end shift': 2,
};
function timePeriodOrder(tp: string) {
  return TIME_ORDER[tp?.toLowerCase()] ?? 99;
}

const COOKIE_KEY = 'lastCheckedAt';

function readCookie(): number | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(COOKIE_KEY + '='));
  if (!match) return null;
  const val = parseInt(match.split('=')[1], 10);
  return isNaN(val) ? null : val;
}

function writeCookie(ts: number, intervalMs: number) {
  const expires = new Date(ts + intervalMs * 2);
  document.cookie = `${COOKIE_KEY}=${ts}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

export function useChecklists(role: string, minIntervalMinutes = 3) {
  const MIN_CHECK_INTERVAL_MS = minIntervalMinutes * 60 * 1000;
  const { activeShift, loading: shiftLoading, submitChecklist } = useWorkerShift();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChecklist, setOpenChecklist] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);


  // When the last item was checked (ms). Initialised from cookie so reload restores the countdown.
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(() => readCookie());
  // Seconds remaining until next check is allowed
  const [secondsLeft, setSecondsLeft] = useState(0);

  const restoredForShift = useRef<string | null>(null);
  const checklistsRef = useRef<Checklist[]>([]);

  useEffect(() => {
    checklistsRef.current = checklists;
  }, [checklists]);

  // Countdown ticker
  useEffect(() => {
    if (lastCheckedAt === null) return;

    const tick = () => {
      const elapsed = Date.now() - lastCheckedAt;
      const remaining = Math.ceil((MIN_CHECK_INTERVAL_MS - elapsed) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick(); // run immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastCheckedAt]);

  // Step 1: fetch checklist templates by role
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'checklists'), where('role', '==', role))
        );

        const lists: Checklist[] = await Promise.all(
          snap.docs.map(async (checkDoc) => {
            const data = checkDoc.data();
            const zonesSnap = await getDocs(collection(db, 'checklists', checkDoc.id, 'zones'));

            const zones: ChecklistZone[] = await Promise.all(
              zonesSnap.docs.map(async (zoneDoc) => {
                const itemsSnap = await getDocs(
                  query(
                    collection(db, 'checklists', checkDoc.id, 'zones', zoneDoc.id, 'items'),
                    orderBy('order', 'asc')
                  )
                );
                const items: CheckItem[] = itemsSnap.docs.map((iDoc) => ({
                  id: iDoc.id,
                  text: iDoc.data().text,
                  order: iDoc.data().order,
                  completed: false,
                }));
                return { id: zoneDoc.id, title: zoneDoc.data().title, items };
              })
            );

            return {
              id: checkDoc.id,
              title: data.title,
              timePeriod: data.timePeriod ?? '',
              zones,
            };
          })
        );

        lists.sort(
          (a, b) =>
            timePeriodOrder(a.timePeriod) - timePeriodOrder(b.timePeriod) ||
            a.title.localeCompare(b.title)
        );

        setChecklists(lists);
        if (lists.length > 0) setOpenChecklist(lists[0].id);
      } catch (err) {
        console.error('useChecklists fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [role]);

  // Step 2: restore saved state from this shift's submitted snapshots
  useEffect(() => {
    if (shiftLoading || loading) return;
    if (!activeShift) return;
    if (restoredForShift.current === activeShift.id) return;
    if (checklists.length === 0) return;

    restoredForShift.current = activeShift.id;

    const restore = async () => {
      try {
        const snap = await getDocs(
          collection(db, 'shifts', activeShift.id, 'checklists')
        );
        if (snap.empty) return;

        const savedMap = new Map<string, Map<string, boolean>>();
        const savedIds = new Set<string>();

        snap.docs.forEach((d) => {
          const data = d.data();
          const itemMap = new Map<string, boolean>();
          (data.items as { itemId: string; completed: boolean }[]).forEach((item) => {
            itemMap.set(item.itemId, item.completed);
          });
          savedMap.set(d.id, itemMap);
          savedIds.add(d.id);
        });

        setChecklists((prev) =>
          prev.map((cl) => {
            const itemMap = savedMap.get(cl.id);
            if (!itemMap) return cl;
            return {
              ...cl,
              zones: cl.zones.map((z) => ({
                ...z,
                items: z.items.map((item) => ({
                  ...item,
                  completed: itemMap.get(item.id) ?? item.completed,
                })),
              })),
            };
          })
        );

        setSubmitted(savedIds);
      } catch (err) {
        console.error('useChecklists restore:', err);
      }
    };

    restore();
  }, [shiftLoading, loading, activeShift, checklists.length]);

  const toggleItem = useCallback((checklistId: string, zoneId: string, itemId: string) => {
    const currentList = checklistsRef.current.find((cl) => cl.id === checklistId);
    const currentZone = currentList?.zones.find((z) => z.id === zoneId);
    const currentItem = currentZone?.items.find((i) => i.id === itemId);
    const isCurrentlyCompleted = currentItem?.completed ?? false;

    // Only enforce delay when marking as completed (not unchecking)
    if (!isCurrentlyCompleted) {
      // Read cookie directly — always fresh, no render-timing gap
      const ts = readCookie();
      if (ts !== null && Date.now() - ts < MIN_CHECK_INTERVAL_MS) {
        // Hard block — update state so countdown banner stays in sync, and show warning popup
        setLastCheckedAt(ts);
        setShowWarning(true);
        return;
      }
      const now = Date.now();
      writeCookie(now, MIN_CHECK_INTERVAL_MS);
      setLastCheckedAt(now);
    }

    setChecklists((prev) =>
      prev.map((cl) => {
        if (cl.id !== checklistId) return cl;
        return {
          ...cl,
          zones: cl.zones.map((z) => {
            if (z.id !== zoneId) return z;
            return {
              ...z,
              items: z.items.map((item) =>
                item.id !== itemId ? item : { ...item, completed: !item.completed }
              ),
            };
          }),
        };
      })
    );
  }, []);

  const handleSubmit = async (cl: Checklist) => {
    if (!activeShift) return;

    const ts = readCookie();
    if (ts !== null && Date.now() - ts < MIN_CHECK_INTERVAL_MS) {
      setLastCheckedAt(ts);
      setShowWarning(true);
      return;
    }

    const now = Date.now();
    writeCookie(now);
    setLastCheckedAt(now);

    setSubmitting(cl.id);
    setSubmitError(null);
    try {
      const allItems = cl.zones.flatMap((z) =>
        z.items.map((item) => ({ itemId: item.id, text: item.text, completed: item.completed }))
      );
      await submitChecklist({
        checklistId: cl.id,
        checklistTitle: cl.title,
        timePeriod: cl.timePeriod,
        items: allItems,
      });

      const newSubmitted = new Set(submitted).add(cl.id);
      setSubmitted(newSubmitted);

      // ── Score calculation ──────────────────────────────
      const allLists = checklistsRef.current;
      const total = allLists.length;
      const completedCount = newSubmitted.size;

      // 60 pts: checklist completion rate
      const checklistRate = total > 0 ? Math.round((completedCount / total) * 60) : 0;

      // 30 pts: item thoroughness — checked items across all submitted lists
      const submittedLists = allLists.filter((c) => newSubmitted.has(c.id));
      const totalItemsAll = submittedLists.flatMap((c) => c.zones.flatMap((z) => z.items)).length;
      const checkedItemsAll = submittedLists.flatMap((c) => c.zones.flatMap((z) => z.items)).filter((i) => i.completed).length;
      const itemRate = totalItemsAll > 0 ? Math.round((checkedItemsAll / totalItemsAll) * 30) : 0;

      // 10 pts: punctuality — read remindersReceived from shift doc
      // We don't have it in local state, so we store it separately and read it on shift end
      // For now save checklistRate + itemRate; punctuality is added on shift end
      const scorePartial = checklistRate + itemRate;

      await updateDoc(doc(db, 'shifts', activeShift.id), {
        score: scorePartial,
        scoreBreakdown: {
          checklistRate,
          itemRate,
          // punctualityScore filled on shift end when remindersReceived is known
        },
        checklistsTotal: total,
        checklistsCompleted: completedCount,
        scoreUpdatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Greška pri snimanju. Pokušaj ponovo.');
    } finally {
      setSubmitting(null);
    }
  };

  const totalItems = (cl: Checklist) => cl.zones.flatMap((z) => z.items).length;
  const doneItems = (cl: Checklist) => cl.zones.flatMap((z) => z.items).filter((i) => i.completed).length;

  const checklistsTotal = checklists.length;
  const checklistsCompleted = submitted.size;
  const score = checklistsTotal > 0 ? Math.round((checklistsCompleted / checklistsTotal) * 100) : 0;

  // Format mm:ss for display
  const countdownDisplay = secondsLeft > 0
    ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
    : null;

  return {
    checklists,
    loading: loading || shiftLoading,
    openChecklist,
    setOpenChecklist,
    toggleItem,
    handleSubmit,
    submitting,
    submitted,
    submitError,
    // true when next check is blocked
    checkBlocked: secondsLeft > 0,
    countdownDisplay,
    totalItems,
    doneItems,
    activeShift,
    score,
    checklistsCompleted,
    checklistsTotal,
    showWarning,
    dismissWarning: () => setShowWarning(false),
  };
}
