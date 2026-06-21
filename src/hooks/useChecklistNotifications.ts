import { useEffect, useRef } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../fb/firebase';
import { requestNotificationPermission, messaging, onMessage } from '../fb/messaging';
import type { WorkerShift } from './useWorkerShift';
import type { Checklist } from './useChecklists';

const REMINDER_DELAY_MS = 10 * 1000; // change to 5 * 60 * 1000 for production

interface Params {
  activeShift: WorkerShift | null;
  checklists: Checklist[];
  submitted: Set<string>;
  workerId: string | undefined;
  workerName: string | undefined;
}

async function showNotification(title: string, body: string) {
  // Prefer service worker notification (works foreground + background)
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      try {
        await reg.showNotification(title, {
          body,
          icon: '/smarter_horeca_1.jpg',
          tag: 'checklist-reminder',
          renotify: true,
        });
        console.log('[notifications] showNotification via SW ✓');
      } catch (err) {
        console.error('[notifications] SW showNotification error:', err);
      }
      return;
    }
  }
  // Fallback for browsers without SW support
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/smarter_horeca_1.jpg' });
    console.log('[notifications] showNotification via Notification API ✓');
  }
}

export function useChecklistNotifications({
  activeShift,
  checklists,
  submitted,
  workerId,
  workerName,
}: Params) {
  const tokenSaved = useRef(false);
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep live refs so the timer closure always reads current values
  const submittedRef = useRef(submitted);
  const checklistsRef = useRef(checklists);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { checklistsRef.current = checklists; }, [checklists]);

  // Request permission once and save FCM token
  useEffect(() => {
    if (tokenSaved.current || !workerId) return;
    tokenSaved.current = true;

    console.log('[notifications] requesting permission...');
    requestNotificationPermission().then((token) => {
      console.log('[notifications] permission result, token:', token ? 'received' : 'null');
      if (!token || !workerId) return;
      updateDoc(doc(db, 'users', workerId), { fcmToken: token }).catch(() => {});
    });

    const unsub = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      showNotification(title ?? 'Smarter HoReCA', body ?? '');
    });

    return () => unsub();
  }, [workerId]);

  // Start 10s/5min reminder when shift is active and checklists are incomplete
  useEffect(() => {
    if (reminderTimer.current) {
      clearTimeout(reminderTimer.current);
      reminderTimer.current = null;
    }

    if (!activeShift) {
      console.log('[notifications] no active shift, timer not started');
      return;
    }

    const hasIncomplete = checklists.some((cl) => !submitted.has(cl.id));
    if (!hasIncomplete) {
      console.log('[notifications] all checklists done, timer not started');
      return;
    }

    console.log(`[notifications] timer started — fires in ${REMINDER_DELAY_MS / 1000}s`);

    reminderTimer.current = setTimeout(async () => {
      // Read live values via refs — not stale closure values
      const currentSubmitted = submittedRef.current;
      const currentChecklists = checklistsRef.current;
      const stillIncomplete = currentChecklists.filter((cl) => !currentSubmitted.has(cl.id));

      console.log('[notifications] timer fired, incomplete:', stillIncomplete.length);

      if (stillIncomplete.length === 0) return;

      const count = stillIncomplete.length;
      const title = 'Podsjetnik — check liste';
      const body = `Imaš ${count} nedovršen${count === 1 ? 'u' : 'ih'} listu. Molimo završi ih.`;

      await showNotification(title, body);

      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'checklist_reminder',
          title,
          body,
          workerId: workerId ?? null,
          workerName: workerName ?? '',
          shiftId: activeShift.id,
          customerId: activeShift.customerId,
          date: activeShift.date,
          incompleteChecklists: stillIncomplete.map((cl) => ({ id: cl.id, title: cl.title })),
          createdAt: serverTimestamp(),
          read: false,
        });
        // Increment remindersReceived on shift doc — used for punctuality score
        await updateDoc(doc(db, 'shifts', activeShift.id), {
          remindersReceived: increment(1),
        }).catch(() => {});

        console.log('[notifications] saved to Firestore ✓');
      } catch (err) {
        console.error('[notifications] Firestore save error:', err);
      }
    }, REMINDER_DELAY_MS);

    return () => {
      if (reminderTimer.current) clearTimeout(reminderTimer.current);
    };
  }, [activeShift?.id, submitted.size, checklists.length]);
}
