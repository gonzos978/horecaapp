import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
    lat?: string;
    lng?: string;
    onSelect: (lat: string, lng: string, address: string, city: string, country: string) => void;
    onClose: () => void;
}

export default function LocationPicker({ lat, lng, onSelect, onClose }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<{ lat: number; lng: number; address: string; city: string; country: string } | null>(null);

    const initLat = lat ? parseFloat(lat) : 43.8563;
    const initLng = lng ? parseFloat(lng) : 18.4131;

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        const map = L.map(mapRef.current).setView([initLat, initLng], lat ? 14 : 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        if (lat && lng) {
            const m = L.marker([initLat, initLng]).addTo(map);
            markerRef.current = m;
        }

        map.on("click", async (e) => {
            const { lat, lng } = e.latlng;
            placeMarker(map, lat, lng);
        });

        leafletMap.current = map;

        return () => { map.remove(); leafletMap.current = null; };
    }, []);

    const placeMarker = async (map: L.Map, lat: number, lng: number) => {
        if (markerRef.current) markerRef.current.remove();
        const m = L.marker([lat, lng]).addTo(map);
        markerRef.current = m;

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();
            const addr = data.address || {};
            const address = [addr.road, addr.house_number].filter(Boolean).join(" ");
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const country = addr.country || "";
            const display = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            m.bindPopup(display).openPopup();
            setSelected({ lat, lng, address, city, country });
        } catch {
            setSelected({ lat, lng, address: "", city: "", country: "" });
        }
    };

    const handleSearch = async () => {
        if (!search.trim() || !leafletMap.current) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`
            );
            const data = await res.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                const map = leafletMap.current;
                map.setView([parseFloat(lat), parseFloat(lon)], 14);
                await placeMarker(map, parseFloat(lat), parseFloat(lon));
            }
        } finally {
            setSearching(false);
        }
    };

    const handleConfirm = () => {
        if (!selected) return;
        onSelect(
            selected.lat.toFixed(6),
            selected.lng.toFixed(6),
            selected.address,
            selected.city,
            selected.country
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <MapPin size={20} className="text-indigo-600" />
                        Pick Location on Map
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-slate-100">
                    <div className="flex gap-2">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                            placeholder="Search address or city..."
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button onClick={handleSearch} disabled={searching}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
                            <Search size={15} />
                            {searching ? "..." : "Search"}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Or click anywhere on the map to place a pin</p>
                </div>

                {/* Map */}
                <div ref={mapRef} className="flex-1" style={{ minHeight: 380 }} />

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
                    {selected ? (
                        <div className="text-sm text-slate-600 min-w-0">
                            <span className="font-semibold text-slate-800">Selected:</span>{" "}
                            <span className="text-indigo-600">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</span>
                            {selected.city && <span className="ml-1 text-slate-500">— {selected.city}</span>}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">No location selected yet</p>
                    )}
                    <div className="flex gap-2 shrink-0">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                            Cancel
                        </button>
                        <button onClick={handleConfirm} disabled={!selected}
                            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1.5">
                            <MapPin size={14} /> Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
