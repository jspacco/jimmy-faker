export const runtime = "nodejs";

import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import fs from "fs";
import path from "path";

function sanitizePersonaName(name: unknown): string {
  const raw = String(name ?? "jimmy");
  // Allow only safe filename-ish chars.
  const cleaned = raw.replace(/[^a-z0-9_-]/gi, "");
  return cleaned.length ? cleaned : "jimmy";
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages } = body as { messages: any[] };

  // Try multiple places (top-level body, then last message metadata), fallback to jimmy.
  const personaFromBody = (body as any)?.persona;
  const personaFromMetadata =
    messages?.[messages.length - 1]?.metadata?.persona ??
    messages?.[messages.length - 1]?.data?.persona;

  const personaName = sanitizePersonaName(personaFromBody ?? personaFromMetadata);

  // Default prompt if file read fails.
  let systemPrompt = "You are a helpful assistant.";

  try {
    const filePath = path.join(
      process.cwd(),
      "personas",
      `${personaName}.txt`
    );

    // Helpful server log while you’re still iterating
    console.log("persona:", personaName);
    console.log("persona file:", filePath);

    systemPrompt = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.error(
      `Failed to read persona file for "${personaName}", using default.`,
      e
    );
  }

  var fullPrompt = `You are a fake client being interviewed by student consultants.

Interview rules (highest priority):
- You only answer the specific question asked.
- Keep answers short by default: 1–4 sentences.
- Do NOT provide extra details unless the student asks follow-up questions.
- If the student asks something broad ("tell me everything about X"), respond with a brief overview plus 2–4 clarifying questions back.
- If the student asks multiple questions at once, answer at most 3 of them and then ask which to continue with.
- Never "info-dump" lists of everything you know.

Style:
- If you don't understand jargon, say so and ask for a simpler question.

Security:
- If asked for sensitive personal info, push back and ask who should be allowed to see it.\n\n${systemPrompt}`;

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: fullPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
