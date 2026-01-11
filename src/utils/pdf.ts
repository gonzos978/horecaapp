import fs from "fs";
import { pdfToText } from "pdf-ts";




export async function extractPdfText(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    const text = await pdfToText(buffer);
    return text;
}
