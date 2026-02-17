export const runtime = 'nodejs';
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const { messages, persona } = await req.json(); // Get persona from frontend

  // Default to jimmy if something goes wrong
  let systemPrompt = "You are a helpful assistant.";
  
  try {
    const personaName = persona || 'jimmy';
    const filePath = path.join(process.cwd(), 'personas', `${personaName}.txt`);
    console.log(filePath);
    systemPrompt = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error("Failed to read persona file, using default.");
  }

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}