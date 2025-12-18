import React from "react";
import { useForm } from "react-hook-form";
import { auth, db } from "../fb/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { ROLE } from "../models/role";
import { useAuth } from "../contexts/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface AddUserModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUserAdded: () => void;
}

interface FormValues {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly password: string;
  readonly type: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const { currentUser } = useAuth();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      type: "waiter",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    const newUser = {
      ...data,
      createdAt: serverTimestamp(),
      customerId: currentUser.customerId,
      customerName: currentUser.customerName,
      isAdmin: false,
      role: currentUser.role === ROLE.CUSTOMER ? ROLE.MANAGER : ROLE.WORKER,
      type: currentUser.role === ROLE.CUSTOMER ? ROLE.MANAGER : data.type,
    };
    try {
      await setDoc(doc(db, "users", newUser.email), {
        ...newUser,
      });
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      reset();
      onClose();
      onUserAdded();
    } catch (err) {
      console.error("Greška pri dodavanju korisnika:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Dodaj novog korisnika</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("name", { required: true })}
            placeholder="Ime i prezime"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            {...register("email", { required: true })}
            placeholder="Email"
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            {...register("password", { required: true })}
            placeholder="Šifra"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            {...register("phone", { required: true })}
            placeholder="Telefon"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            {...register("address", { required: true })}
            placeholder="Adresa"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {currentUser?.role !== ROLE.CUSTOMER && (
            <select
              id="type"
              {...register("type", { required: "Obavezno polje" })}
            >
              <option value="waiter">Konobar</option>
              <option value="cook">Kuhar</option>
              <option value="housekeeping">Sobarica</option>
            </select>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Otkaži
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-strong"
            >
              Sačuvaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
