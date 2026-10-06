import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 5_000_000;
const MAX_PAGES = 10;
const MAX_TEXT_CHARS = 50_000;

export async function extractResumePdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Only PDF resumes are supported.");
  if (file.size > MAX_BYTES) throw new Error("Resume PDF must be 5 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PAGES) throw new Error("Resume PDF must contain 10 pages or fewer.");
  const { text } = await extractText(pdf, { mergePages: true });
  const cleaned = text.replace(/\\u0000/g, " ").trim().slice(0, MAX_TEXT_CHARS);
  if (cleaned.length < 40) throw new Error("The resume did not contain enough readable text to parse.");
  return cleaned;
}