import {useState, useEffect} from "react";
import {collection, getDocs, query, deleteDoc, orderBy, doc, where} from "firebase/firestore";
import {db} from "@/fb/firebase";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Clock, User, Search, Loader2, Trash} from "lucide-react";
import {useNavigate} from "react-router-dom";

// Types to match your structure
interface Checklist {
    id: string;
    title: string;
    role: string;
    timePeriod: string;
    description: string;
}

export default function ChecklistListView() {
    const navigate = useNavigate();

    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [timeFilter, setTimeFilter] = useState<string>("all");





    useEffect(() => {
        fetchChecklists();
    }, []);

    const fetchChecklists = async () => {
        setLoading(true);
        try {
            // Updated query to filter by isGlobal === true
            const q = query(
                collection(db, "checklists"),
                where("isGlobal", "==", true), // Added this filter
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Checklist));

            setChecklists(data);
        } catch (error) {
            console.error("Error fetching checklists:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    // Filter Logic - Updated with safety checks
    const filteredChecklists = checklists.filter(cl => {
        // We add ?. and ?? "" to handle missing data safely
        const checklistTitle = cl.title?.toLowerCase() ?? "";
        const searchTerm = search.toLowerCase();

        const matchesSearch = checklistTitle.includes(searchTerm);
        const matchesRole = roleFilter === "all" || cl.role === roleFilter;
        const matchesTime = timeFilter === "all" || cl.timePeriod === timeFilter;

        return matchesSearch && matchesRole && matchesTime;
    });

    // Get unique time periods for the filter dropdown
    // Updated to handle missing timePeriod values safely
    const uniqueTimePeriods = Array.from(
        new Set(checklists.map(cl => cl.timePeriod).filter(Boolean))
    ) as string[];


// ... inside your component
    const deleteChecklist = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this checklist?")) return;

        try {
            await deleteDoc(doc(db, "checklists", id));
            // Update local state to remove the deleted item
            setChecklists(prev => prev.filter(cl => cl.id !== id));
            alert("Checklist deleted successfully");
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete checklist");
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Checklist Library</h1>
                <p className="text-muted-foreground">Manage and view all active staff checklists.</p>
            </header>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-xl border">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search by title..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                        <User className="w-4 h-4 mr-2"/>
                        <SelectValue placeholder="Filter by Role"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger>
                        <Clock className="w-4 h-4 mr-2"/>
                        <SelectValue placeholder="Filter by Phase"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Phases</SelectItem>
                        <SelectItem value="Start shift">Start shift</SelectItem>
                        <SelectItem value="During shift">During shift</SelectItem>
                        <SelectItem value="End shift">End shift</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChecklists.map(cl => (
                        <Card key={cl.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl">{cl.title}</CardTitle>
                                    <Badge variant="outline" className="capitalize">
                                        {cl.role}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {cl.timePeriod && (
                                        <Badge
                                            variant="secondary"
                                            className={`
            ${cl.timePeriod === "Start shift" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
            ${cl.timePeriod === "During shift" ? "bg-sky-100 text-sky-700 hover:bg-sky-100" : ""}
            ${cl.timePeriod === "End shift" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : ""}
        `}
                                        >
                                            {cl.timePeriod}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {cl.description || "No description provided."}
                                </p>
                                <div
                                    className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Click to view zones & items</span>
                                    <div className="flex -space-x-2">
                                        {/* Placeholder for zone count or similar stats */}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm"
                                        onClick={() => navigate(`../edit-checklist/${cl.id}`)}>
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteChecklist(cl.id)}>
                                    <Trash size={14}/>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && filteredChecklists.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No checklists match your filters.</p>
                </div>
            )}
        </div>
    );
}