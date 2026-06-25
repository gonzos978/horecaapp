import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { httpsCallable } from "firebase/functions";
import { functions } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";

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

const createWorkerFn = httpsCallable(functions, "createWorker");

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { type: "waiter" },
  });

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    setError(null);
    setLoading(true);
    try {
      await createWorkerFn({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        type: data.type,
      });
      reset();
      onClose();
      onUserAdded();
    } catch (err: any) {
      console.error("Greška pri dodavanju korisnika:", err);
      setError(err?.message ?? "Greška pri dodavanju korisnika.");
    } finally {
      setLoading(false);
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
          <select
              id="type"
              {...register("type", { required: "Obavezno polje" })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <optgroup label="Menadžment">
                <option value="hotel_manager">Menadžer hotela</option>
                <option value="restaurant_manager">Menadžer restorana</option>
                <option value="manager">Menadžer</option>
              </optgroup>
              <optgroup label="Kuhinja">
                <option value="executive_chef">Glavni kuvar</option>
                <option value="cook">Kuvar</option>
                <option value="sous_cook">Pomoćni kuvar</option>
              </optgroup>
              <optgroup label="Sala / Bar">
                <option value="waiter">Konobar</option>
                <option value="busser">Servirka</option>
                <option value="bartender">Šanker</option>
                <option value="mixologist">Koktel majstor</option>
              </optgroup>
              <optgroup label="Domaćinstvo">
                <option value="housekeeper">Sobarica</option>
                <option value="housekeeping">Sobarica (stari tip)</option>
                <option value="cleaner">Higijeničarka</option>
              </optgroup>
              <optgroup label="Ostalo">
                <option value="night_security">Noćni čuvar</option>
                <option value="maintenance">Domar</option>
                <option value="groundskeeper">Vrtlar</option>
                <option value="spa_staff">SPA osoblje</option>
              </optgroup>
            </select>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-strong disabled:opacity-50"
            >
              {loading ? "Snimanje..." : "Sačuvaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
