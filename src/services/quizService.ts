export async function createQuizFromPdf(documentId: string) {
    try {
        const res = await fetch("https://YOUR_BACKEND_URL/createQuizFromPdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to create quiz");

        return data;
    } catch (err: any) {
        console.error("Error creating quiz:", err);
        throw err;
    }
}
