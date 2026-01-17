import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, Clock, Loader2, Save } from "lucide-react";
import { doc, getDoc, getDocs, collection, query, orderBy, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/fb/firebase";

type Role = "waiter" | "chef" | "manager";
interface ZoneItem { id: string; text: string; }
interface ZoneForm { id: string; title: string; items: ZoneItem[]; }

export default function AdminEditChecklist() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timePeriod, setTimePeriod] = useState("");
    const [role, setRole] = useState<Role>("waiter");
    const [zones, setZones] = useState<ZoneForm[]>([]);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // 1. Load Main Checklist
            const snap = await getDoc(doc(db, "checklists", id!));
            if (!snap.exists()) return navigate("/admin/view-checklist");
            const data = snap.data();
            setTitle(data.title);
            setDescription(data.description);
            setTimePeriod(data.timePeriod || "");
            setRole(data.role);

            // 2. Load Zones
            const zonesSnap = await getDocs(collection(db, "checklists", id!, "zones"));
            const loadedZones: ZoneForm[] = [];

            for (const zDoc of zonesSnap.docs) {
                // 3. Load Items for each Zone
                const itemsSnap = await getDocs(query(
                    collection(db, "checklists", id!, "zones", zDoc.id, "items"),
                    orderBy("order")
                ));

                loadedZones.push({
                    id: zDoc.id,
                    title: zDoc.data().title,
                    items: itemsSnap.docs.map(i => ({ id: i.id, text: i.data().text }))
                });
            }
            setZones(loadedZones);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        const batch = writeBatch(db);
        const mainRef = doc(db, "checklists", id!);

        // Update main doc
        batch.update(mainRef, { title, description, timePeriod, role, updatedAt: serverTimestamp() });

        // Note: For a deep update, we usually overwrite or specifically update sub-docs.
        // For this version, let's keep it simple: we update the existing zone titles.
        for (const zone of zones) {
            const zRef = doc(db, "checklists", id!, "zones", zone.id);
            batch.set(zRef, { title: zone.title }, { merge: true });

            zone.items.forEach((item, idx) => {
                const iRef = doc(db, "checklists", id!, "zones", zone.id, "items", item.id);
                batch.set(iRef, { text: item.text, order: idx + 1 }, { merge: true });
            });
        }

        await batch.commit();
        alert("Updated successfully! ✅");
        navigate("/admin/view-checklist");
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Edit Checklist</h1>
                <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
                    <Input value={timePeriod} onChange={e => setTimePeriod(e.target.value)} placeholder="Time Period" />
                    <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="waiter">Waiter</SelectItem>
                            <SelectItem value="chef">Chef</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {zones.map((zone, zi) => (
                <Card key={zone.id}>
                    <CardHeader>
                        <Input
                            className="font-bold"
                            value={zone.title}
                            onChange={e => {
                                const copy = [...zones];
                                copy[zi].title = e.target.value;
                                setZones(copy);
                            }}
                        />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {zone.items.map((item, ii) => (
                            <Input
                                key={item.id}
                                value={item.text}
                                onChange={e => {
                                    const copy = [...zones];
                                    copy[zi].items[ii].text = e.target.value;
                                    setZones(copy);
                                }}
                            />
                        ))}
                    </CardContent>
                </Card>
            ))}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center">
                <Button className="w-full max-w-4xl" onClick={handleUpdate}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
        </div>
    );
}