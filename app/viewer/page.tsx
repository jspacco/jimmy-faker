"use client";

import { useMemo, useRef, useState } from "react";
import "../jimmy-chat.css";

type TranscriptMsg = {
  role: "user" | "assistant" | "system" | string;
  text: string;
};

type TranscriptFile = {
  client?: string;
  timestamp?: string;
  transcript?: TranscriptMsg[];
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Simple, safe-ish support for **bold**
function renderBoldMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  // Convert **...** to <strong>...</strong> after escaping
  return escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

export default function ViewerPage() {
  const [data, setData] = useState<TranscriptFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const headerTitle = useMemo(() => {
    if (!data) return "Transcript Viewer";
    const who = (data.client || "Client").toString();
    return `Transcript Viewer — ${who}`;
  }, [data]);

  const sessionLine = useMemo(() => {
    if (!data?.timestamp) return null;
    const who = (data.client || "Client").toString();
    const ts = new Date(data.timestamp).toLocaleString();
    return `Session with ${who} started on ${ts}`;
  }, [data]);

  const transcript: TranscriptMsg[] = useMemo(() => {
    return (data?.transcript ?? []).map((m) => ({
      role: (m.role ?? "assistant") as any,
      text: (m.text ?? "").toString(),
    }));
  }, [data]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as TranscriptFile;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON did not parse into an object.");
      }
      if (!Array.isArray(parsed.transcript)) {
        throw new Error("Missing or invalid `transcript` array.");
      }

      setData(parsed);

      // scroll to bottom after render
      setTimeout(() => {
        const el = messagesRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    } catch (e: any) {
      console.error(e);
      setData(null);
      setError(
        "Could not load transcript JSON. Make sure you selected a valid jimmy-faker export."
      );
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleFile(file);
    // allow re-uploading the same file without refreshing
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div className="chat-container" onDrop={onDrop} onDragOver={onDragOver}>
      <header className="chat-header">
        <h1>{headerTitle}</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="export-btn" onClick={openFilePicker}>
            Load JSON
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </header>

      <div className="messages-window" ref={messagesRef}>
        {!data && (
          <div style={{ textAlign: "center", opacity: 0.7, padding: "40px 12px" }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              Drop a transcript JSON here, or click <strong>Load JSON</strong>.
            </div>
            <div style={{ fontSize: 13 }}>
              (Uses the same styling as the chat UI.)
            </div>
          </div>
        )}

        {error && (
          <div className="error" style={{ textAlign: "center" }}>
            {error}
          </div>
        )}

        {data && sessionLine && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              opacity: 0.7,
              padding: "8px 0 2px",
            }}
          >
            {sessionLine}
          </div>
        )}

        {data &&
          transcript.map((msg, idx) => {
            const role =
              msg.role === "user" ? "user" : msg.role === "assistant" ? "assistant" : "system";

            const label =
              role === "user"
                ? "Student"
                : role === "assistant"
                ? (data.client || "Client").toString()
                : "System";

            return (
              <div key={`${idx}-${role}`} className={`message-row ${role}`}>
                <div className="bubble">
                  <div className="sender-label">{label}</div>
                  <div
                    className="text-content"
                    // safe-ish: we escape HTML first, then only add <strong>
                    dangerouslySetInnerHTML={{ __html: renderBoldMarkdown(msg.text) }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer hint (optional, small) */}
      <div style={{ textAlign: "center", fontSize: 12, opacity: 0.55, padding: "10px 0 2px" }}>
        Tip: drag & drop a JSON transcript anywhere on this page.
      </div>
    </div>
  );
}
