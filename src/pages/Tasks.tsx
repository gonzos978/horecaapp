import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { ITask, TASK_LIST_BY_TYPE } from "../models/tasks";

export default function Tasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
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
        if (currentUser.type) {
          const updatedTasks = TASK_LIST_BY_TYPE[currentUser.type].map(
            (task: ITask) => {
              const found = doneTasks.find((t: any) => t.taskId === task.id);
              return {
                ...task,
                done: !!found,
                timestamp: found?.timestamp?.toDate
                  ? found.timestamp.toDate()
                  : found?.timestamp,
              };
            }
          );
          setTasks(updatedTasks);
        }
      } else {
        setTasks(TASK_LIST_BY_TYPE[currentUser.type]);
      }
    };

    fetchTasks();
  }, [currentUser?.email]);

  const handleTaskClick = async (taskId: string) => {
    if (!shiftDocId || !currentUser) return;

    const docRef = doc(db, "workingDays", shiftDocId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      alert("Niste prijavljeni u smijenu");
      return;
    }
    if (docSnap.data().checkOut) {
      alert("Vaša smjena je gotova, zadatke ne možete obavljati do sutra");
      return;
    }
    let tasksDone: any[] = docSnap.data().tasksDone;

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

    await updateDoc(docRef, { tasksDone });

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
