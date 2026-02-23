"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useParams } from "next/navigation";
import "../jimmy-chat.css";

function messageToText(m: any): string {
  const parts = (m?.parts ?? []) as any[];
  return parts
    .filter((p) => p?.type === "text")
    .map((p) => p?.text ?? "")
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderBasicMarkdown(text: string): string {
  const escaped = escapeHtml(text);

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

export default function ClientChat() {
  const params = useParams();
  const clientName = (params.client as string) || "jimmy";

  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    // Some versions do not include this reliably; we also send persona via metadata per message.
    body: { persona: clientName },
    onError: (e: unknown) => console.error("useChat error:", e),
  } as any);

  const exportJSON = () => {
    const data = {
      client: clientName,
      timestamp: new Date().toISOString(),
      transcript: messages.map((m: any) => ({
        role: m.role,
        text: messageToText(m),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${clientName}.json`;
    link.click();
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Interviewing: {clientName.toUpperCase()}</h1>
        <button onClick={exportJSON} className="export-btn">
          Download JSON
        </button>
      </header>

      <div className="messages-window">
        {messages.map((m: any) => {
          const messageText = messageToText(m);

          return (
            <div key={m.id} className={`message-row ${m.role}`}>
              <div className="bubble">
                <div className="sender-label">
                  {m.role === "user" ? "Student" : clientName}
                </div>
                <div className="text-content"
                  dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(messageText) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="input-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;

          setInput("");

          // Send persona reliably with each message.
          await sendMessage({
            text,
            metadata: { persona: clientName },
          });
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${clientName} about the business...`}
          disabled={status === "submitted" || status === "streaming"}
        />
        <button type="submit" disabled={!input.trim()}>
          Send
        </button>
      </form>

      {error && (
        <div className="error">{String((error as any).message ?? error)}</div>
      )}
    </div>
  );
}
