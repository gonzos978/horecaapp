import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Worker() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Read worker object from state
    const worker = location.state?.worker;

    const handleBack = () => {
        navigate("/app/home");
    };

    const handleEdit = () => {
        navigate(`/app/workers/edit/${encodeURIComponent(worker.id)}`, { state: { worker } });
    };

    if (!worker) {
        return (
            <div className="p-8">
                <p className="text-red-500">Worker data not found.</p>
                <button
                    onClick={handleBack}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        ← Back to Dashboard
                    </button>
                    <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                        ✎ Edit
                    </button>
                </div>
            </div>

            {/* Worker info */}
            <div className="bg-white p-6 rounded-lg shadow space-y-2">
                <p><strong>Email:</strong> {worker.email}</p>
                <p><strong>Role:</strong> {worker.role}</p>
                <p><strong>Type:</strong> {worker.type}</p>
                <p><strong>Phone:</strong> {worker.phone || "N/A"}</p>
                <p><strong>Address:</strong> {worker.address || "N/A"}</p>
                <p><strong>Customer:</strong> {worker.customerName}</p>
                <p><strong>Created At:</strong> {new Date(worker.createdAt.seconds * 1000).toLocaleString()}</p>
            </div>
        </div>
    );
}
