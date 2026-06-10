import { useEffect, useRef } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../fb/firebase';
import { requestNotificationPermission, messaging, onMessage } from '../fb/messaging';
import type { WorkerShift } from './useWorkerShift';
import type { Checklist } from './useChecklists';

const REMINDER_DELAY_MS = 10 * 1000; // 5 minutes

interface Params {
  activeShift: WorkerShift | null;
  checklists: Checklist[];
  submitted: Set<string>;
  workerId: string | undefined;
  workerName: string | undefined;
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
  const lastShiftId = useRef<string | null>(null);

  // Request permission once and save FCM token to user's Firestore doc
  useEffect(() => {
    if (tokenSaved.current || !workerId) return;
    tokenSaved.current = true;

    requestNotificationPermission().then((token) => {
      if (!token || !workerId) return;
      updateDoc(doc(db, 'users', workerId), { fcmToken: token }).catch(() => {
        // user doc keyed by email — skip silently if it fails
      });
    });

    // Listen for foreground messages and show a local notification
    const unsub = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      if (Notification.permission === 'granted') {
        new Notification(title ?? 'Smarter HoReCA', {
          body: body ?? '',
          icon: '/smarter_horeca_1.jpg',
          tag: 'checklist-reminder',
        });
      }
    });

    return () => unsub();
  }, [workerId]);

  // Start/restart 5-min reminder whenever shift or submissions change
  useEffect(() => {
    if (!activeShift) return;

    const hasIncomplete = checklists.some((cl) => !submitted.has(cl.id));

    // Clear any existing timer
    if (reminderTimer.current) {
      clearTimeout(reminderTimer.current);
      reminderTimer.current = null;
    }

    if (!hasIncomplete) return;

    // New shift — reset
    if (lastShiftId.current !== activeShift.id) {
      lastShiftId.current = activeShift.id;
    }

    reminderTimer.current = setTimeout(async () => {
      // Re-check: user might have submitted in the meantime
      const stillIncomplete = checklists.filter((cl) => !submitted.has(cl.id));
      if (stillIncomplete.length === 0) return;

      const count = stillIncomplete.length;
      const title = 'Podsjetnik — check liste';
      const body = `Imaš ${count} nedovršen${count === 1 ? 'u' : 'ih'} listu. Molimo završi ih.`;

      // Show local notification (works when tab is open)
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/smarter_horeca_1.jpg',
          tag: 'checklist-reminder',
        });
      }

      // Persist notification to Firestore for history / manager view
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
          incompleteChecklists: stillIncomplete.map((cl) => ({
            id: cl.id,
            title: cl.title,
          })),
          createdAt: serverTimestamp(),
          read: false,
        });
      } catch (err) {
        console.error('useChecklistNotifications save:', err);
      }
    }, REMINDER_DELAY_MS);

    return () => {
      if (reminderTimer.current) clearTimeout(reminderTimer.current);
    };
  }, [activeShift?.id, submitted.size, checklists.length]);
}
