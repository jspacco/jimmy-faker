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

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
