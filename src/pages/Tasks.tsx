import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { ITask, TASK_LIST_BY_TYPE } from "../models/tasks";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Tasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const shiftDocId = currentUser?.email
    ? `${currentUser.email}_${todayKey}`
    : null;

  const handleTaskClick = async (task: ITask) => {
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

    let tasksDone: any[] = docSnap.data().tasksDone || [];

    const isDone = tasksDone.find((t) => t.taskId === task.id);

    if (isDone) {
      // Zadatak nije urađen pa se briše - recimo da je user greškom chekirao
      tasksDone = tasksDone.filter((t) => t.taskId !== task.id);
    } else {
      // Provjere
      // kada je input polje obavezno
      if (task.hasInput && !task.temp) {
        alert(
          "Morate unijeti traženu vrijednost prije nego označite zadatak kao urađen."
        );
        return;
      }
      // kada je sika obavezna
      if (task.photoRequired && !task.photoFile) {
        alert(
          "Morate odabrati fotografiju prije nego označite zadatak kao urađen."
        );
        return;
      }

      // Upload fotografije ako postoji
      let photoUrl: string | null = null;
      if (task.photoRequired && task.photoFile) {
        const storageRef = ref(storage, `tasksPhotos/${task.id}_${Date.now()}`);
        await uploadBytes(storageRef, task.photoFile);
        photoUrl = await getDownloadURL(storageRef);
      }
      // update podataka
      tasksDone.push({
        taskId: task.id,
        timestamp: new Date(),
        temp: task.temp,
        photo: photoUrl,
      });
    }

    // pozivamo bazu
    await updateDoc(docRef, { tasksDone });

    // updatujemo lokalni state
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !isDone } : t))
    );
  };

  const handleInputChange = (taskId: string, value: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, temp: value } : task))
    );
  };

  const handlePhotoChange = (taskId: string, file: File | null) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, photoFile: file } : task
      )
    );
  };

  useEffect(() => {
    if (!currentUser || !shiftDocId) return;

    const fetchTasks = async () => {
      const docRef = doc(db, "workingDays", shiftDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const doneTasks = data.tasksDone || [];
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
                temp: found?.temp || "",
                photo: found?.photo || null,
                photoFile: null, // fajl još nije odabran
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

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Dnevni zadaci</h2>
      <ul className="space-y-4">
        {tasks.map((task) => (
          <li className="flex flex-row gap-8" key={task.id}>
            <button
              onClick={() => handleTaskClick(task)}
              className={`w-full text-left px-4 py-2 rounded-md font-semibold ${
                task.done
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {task.title} {task.done && "✔"}{" "}
              {task.photoRequired && !task.done && "(potrebna fotografija)"}
            </button>
            {task.hasInput && !task.done && (
              <input
                type="text"
                placeholder="Unesite vrijednost"
                value={task.temp || ""}
                onChange={(e) => handleInputChange(task.id, e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            )}

            {task.photoRequired && !task.done && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handlePhotoChange(task.id, e.target.files?.[0] || null)
                }
                className="w-full"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
