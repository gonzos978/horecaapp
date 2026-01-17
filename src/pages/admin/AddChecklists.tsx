import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Plus, Trash, Clock, ClipboardList } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/fb/firebase";

type Role = "waiter" | "chef" | "manager";

interface ZoneItem {
    id: string;
    text: string;
}

interface ZoneForm {
    id: string;
    title: string;
    items: ZoneItem[];
}

export default function AdminAddChecklist() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timePeriod, setTimePeriod] = useState(""); // State for "PRIJE POČETKA SMJENE..."
    const [role, setRole] = useState<Role>("waiter");
    const [zones, setZones] = useState<ZoneForm[]>([]);

    const addZone = () =>
        setZones([...zones, { id: crypto.randomUUID(), title: "", items: [] }]);

    const removeZone = (index: number) =>
        setZones(zones.filter((_, i) => i !== index));

    const addItem = (zoneIndex: number) => {
        const copy = [...zones];
        copy[zoneIndex].items.push({ id: crypto.randomUUID(), text: "" });
        setZones(copy);
    };

    const removeItem = (zoneIndex: number, itemIndex: number) => {
        const copy = [...zones];
        copy[zoneIndex].items.splice(itemIndex, 1);
        setZones(copy);
    };

    const saveChecklist = async () => {
        if (!title || zones.length === 0) {
            alert("Title and at least one zone required");
            return;
        }

        try {
            const checklistRef = await addDoc(collection(db, "checklists"), {
                title,
                description,
                timePeriod, // Saved to Firestore
                role,
                isGlobal: true,
                createdBy: "zions",
                createdAt: serverTimestamp()
            });

            for (const zone of zones) {
                const zoneRef = await addDoc(
                    collection(db, "checklists", checklistRef.id, "zones"),
                    { title: zone.title }
                );

                for (let i = 0; i < zone.items.length; i++) {
                    await addDoc(
                        collection(db, "checklists", checklistRef.id, "zones", zoneRef.id, "items"),
                        {
                            order: i + 1,
                            text: zone.items[i].text,
                            checked: false,
                            updatedAt: serverTimestamp()
                        }
                    );
                }
            }

            alert("Checklist saved ✅");
            // Reset form
            setTitle("");
            setDescription("");
            setTimePeriod("");
            setZones([]);
        } catch (error) {
            console.error("Error saving checklist:", error);
            alert("Error saving checklist");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-6 px-4">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="text-primary" />
                <h1 className="text-2xl font-bold">Create New Checklist</h1>
            </div>

            {/* Main Details */}
            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle>Checklist Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Checklist Title</label>
                            <Input
                                placeholder="e.g., Morning Opening"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role Assignment</label>
                            <Select value={role} onValueChange={v => setRole(v as Role)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="waiter">Waiter</SelectItem>
                                    <SelectItem value="chef">Chef</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Time Period / Schedule</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="e.g., PRIJE POČETKA SMJENE (60 min prije otvaranja)"
                                value={timePeriod}
                                onChange={e => setTimePeriod(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Additional Notes (Optional)</label>
                        <Input
                            placeholder="Extra context for the staff..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Zones Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold italic text-muted-foreground">Checklist Zones</h3>
                    <Button variant="outline" size="sm" onClick={addZone} className="gap-1">
                        <Plus size={16} /> Add Zone
                    </Button>
                </div>

                {zones.map((zone, zi) => (
                    <Card key={zone.id} className="relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Input
                                className="font-bold text-lg border-none focus-visible:ring-0 p-0 h-auto w-full shadow-none bg-transparent"
                                placeholder="Zone Title (e.g., Main Hall)"
                                value={zone.title}
                                onChange={e => {
                                    const copy = [...zones];
                                    copy[zi].title = e.target.value;
                                    setZones(copy);
                                }}
                            />
                            <Button size="icon" variant="ghost" onClick={() => removeZone(zi)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash size={18} />
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {zone.items.map((item, ii) => (
                                <div key={item.id} className="flex items-center gap-3 bg-muted/30 p-2 rounded-md group">
                                    <span className="text-xs font-mono text-muted-foreground w-4">{ii + 1}</span>
                                    <Input
                                        className="border-none focus-visible:ring-0 bg-transparent h-8 p-0"
                                        placeholder="Add task..."
                                        value={item.text}
                                        onChange={e => {
                                            const copy = [...zones];
                                            copy[zi].items[ii].text = e.target.value;
                                            setZones(copy);
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeItem(zi, ii)}
                                    >
                                        <Trash size={14} />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addItem(zi)}
                                className="w-full border-dashed border-2 text-muted-foreground hover:text-primary mt-2"
                            >
                                <Plus size={14} className="mr-2" /> Add Task to {zone.title || "Zone"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Sticky Save Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <Button
                        className="flex-1 h-12 text-lg font-semibold shadow-lg"
                        onClick={saveChecklist}
                        disabled={zones.length === 0}
                    >
                        Publish Checklist
                    </Button>
                </div>
            </div>
        </div>
    );
}