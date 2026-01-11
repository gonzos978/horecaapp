export function cleanText(text: string) {
    return text.replace(/\s+/g, " ").trim();
}

export function chunkText(text: string, size = 3000) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}
