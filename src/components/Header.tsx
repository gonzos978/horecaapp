import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../fb/firebase";
import { ROLE } from "../models/role";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const [todayShift, setTodayShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(false);

  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd"); // "2025-12-17"
  const shiftDocId = currentUser?.email
    ? `${currentUser.email}_${todayKey}`
    : null;

  const isManagerOrWorker = useMemo(() => {
    return (
      currentUser?.role === ROLE.MANAGER || currentUser?.role === ROLE.WORKER
    );
  }, [currentUser]);

  const handleCheckIn = async () => {
    if (!currentUser || !shiftDocId) return;

    const docRef = doc(db, "workingDays", shiftDocId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setTodayShift(docSnap.data());
      return; // Već prijavljen
    }

    await setDoc(docRef, {
      name: currentUser.name,
      customerName: currentUser.customerName,
      customerId: currentUser.customerId,
      email: currentUser.email,
      role: currentUser.role,
      tasksDone: [],
      checkIn: serverTimestamp(),
    });

    const newSnap = await getDoc(docRef);
    setTodayShift(newSnap.data());
  };

  const handleCheckOut = async () => {
    if (!todayShift || !shiftDocId) return;

    const docRef = doc(db, "workingDays", shiftDocId);
    await updateDoc(docRef, {
      checkOut: serverTimestamp(),
    });

    const updatedSnap = await getDoc(docRef);
    setTodayShift(updatedSnap.data());
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  useEffect(() => {
    if (!currentUser || !shiftDocId) return;

    const fetchTodayShift = async () => {
      setIsShiftLoading(true);
      const docRef = doc(db, "workingDays", shiftDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTodayShift(docSnap.data());
      } else {
        setTodayShift(null);
      }
      setIsShiftLoading(false);
    };

    fetchTodayShift();
  }, [currentUser?.email]);

  // Provjera je li shift za danas
  const isTodayShift = todayShift?.checkIn?.toDate
    ? format(todayShift.checkIn.toDate(), "yyyy-MM-dd") === todayKey
    : false;

  return (
    <div className="bg-white shadow-md mb-6 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <img
          src="/smarter_horeca_1.jpg"
          alt="Smarter HoReCa Logo"
          className="h-20 w-auto"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Smarter HoReCA
          </h1>
          <h2 className="text-xl font-semibold text-blue-600">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          )}
        </div>

        {!isManagerOrWorker ? null : isShiftLoading ? (
          <button className="px-3 py-1.5 rounded-md bg-blue-400 hover:bg-blue-400 text-white font-semibold">
            Loading
          </button>
        ) : isTodayShift ? (
          !todayShift.checkOut ? (
            <button
              onClick={handleCheckOut}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Odjava
            </button>
          ) : (
            <button className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Gotovo
            </button>
          )
        ) : (
          <button
            onClick={handleCheckIn}
            className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Prijava
          </button>
        )}

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-800 text-white font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
