import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  done: boolean;
  timestamp?: Date;
}

const TASK_LIST: Task[] = [
  { id: "uniform", title: "Obukao radnu uniformu", done: false },
  {
    id: "clean_hall",
    title: "Provjerio čistoću sale/ljetne bašte",
    done: false,
  },
  {
    id: "check_tables",
    title: "Provjerio stolove, karanfinge, promo materijale",
    done: false,
  },
  { id: "bar_review", title: "Pregledao stanje šanka i popisa", done: false },
  {
    id: "kitchen_review",
    title: "Upoznao se sa stanjem jela u kuhinji",
    done: false,
  },
];

export default function Tasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const shiftDocId = currentUser?.email
    ? `${currentUser.email}_${todayKey}`
    : null;

  useEffect(() => {
    if (!currentUser || !shiftDocId) return;

    const fetchTasks = async () => {
      const docRef = doc(db, "workingDays", shiftDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const doneTasks = data.tasksDone || [];
        // Mapiramo TASK_LIST da označimo done
        const updatedTasks = TASK_LIST.map((task) => {
          const found = doneTasks.find((t: any) => t.taskId === task.id);
          return {
            ...task,
            done: !!found,
            timestamp: found?.timestamp?.toDate
              ? found.timestamp.toDate()
              : found?.timestamp,
          };
        });
        setTasks(updatedTasks);
      } else {
        setTasks(TASK_LIST);
      }
    };

    fetchTasks();
  }, [currentUser?.email]);

  const handleTaskClick = async (taskId: string) => {
    if (!shiftDocId || !currentUser) return;

    const docRef = doc(db, "workingDays", shiftDocId);
    const docSnap = await getDoc(docRef);

    let tasksDone: any[] = docSnap.exists()
      ? docSnap.data().tasksDone || []
      : [];

    const isDone = tasksDone.find((t) => t.taskId === taskId);

    if (isDone) {
      // Revert: ukloni iz tasksDone
      tasksDone = tasksDone.filter((t) => t.taskId !== taskId);
    } else {
      // Dodaj novi task
      tasksDone.push({
        taskId,
        timestamp: new Date(),
      });
    }

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        name: currentUser.name,
        customerName: currentUser.customerName,
        customerId: currentUser.customerId,
        email: currentUser.email,
        role: currentUser.role,
        checkIn: serverTimestamp(),
        tasksDone,
      });
    } else {
      await updateDoc(docRef, { tasksDone });
    }

    // Update lokalnog state-a
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, done: !isDone } : task
      )
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Dnevni zadaci</h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => handleTaskClick(task.id)}
              className={`w-full text-left px-4 py-2 rounded-md font-semibold ${
                task.done
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {task.title} {task.done && "✔"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
