import React from "react";
import { useForm } from "react-hook-form";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../fb/firebase";

interface AddNotificationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onNotificationAdded: () => void;
}

interface FormValues {
  readonly title: string;
  readonly description: string;
  readonly type: string;
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly amount: number | null;
}

const AddNotificationModal: React.FC<AddNotificationModalProps> = ({
  isOpen,
  onClose,
  onNotificationAdded,
}) => {
  const { currentUser } = useAuth();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      type: "worker",
      priority: "medium",
      amount: null,
    },
  });

  const getVisibleFor = (type: string) => {
    const baseRoles = ["manager", "customer"];
    if (type === "worker") {
      return ["cook", "housekeeping", "waiter", ...baseRoles];
    }
    return [type, ...baseRoles];
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    console.log(data);
    const docData = {
      ...data,
      visibleFor: getVisibleFor(data.type),
      createdAt: serverTimestamp(),
      creatorId: currentUser.email,
      creatorName: currentUser.name,
      customerId: currentUser.customerId,
      amount:
        typeof data.amount === "number" && !isNaN(data.amount)
          ? data.amount
          : null,
    };

    try {
      await addDoc(collection(db, "notifications"), docData);
      reset();
      onClose();
      onNotificationAdded();
    } catch (err) {
      console.error("Greška pri dodavanju obavijesti:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Dodaj novu obavijest</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("title", { required: true })}
            placeholder="Naslov"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <textarea
            {...register("description", { required: true })}
            placeholder="Opis"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <select className="block" {...register("type", { required: true })}>
            <option value="worker">Worker</option>
            <option value="cook">Cook</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="waiter">Waiter</option>
          </select>
          <select
            className="block"
            {...register("priority", { required: true })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input
            {...register("amount", { valueAsNumber: true })}
            type="number"
            placeholder="Amount"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />

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

export default AddNotificationModal;
