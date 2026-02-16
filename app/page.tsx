"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import "./jimmy-chat.css";

export default function JimmyChat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    onError: (e) => console.error("useChat error:", e),
  });

  return (
    <div className="chat-container">
      <h1>Chat with Jimmy (Gym Owner)</h1>

      <div className="messages">
        {messages.map((m: any) => {
          const text =
            (m.parts ?? [])
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("") || "";

          return (
            <div
              key={m.id}
              className={`message ${m.role === "user" ? "user" : "bot"}`}
            >
              <div className="label">
                {m.role === "user" ? "Student" : "Jimmy Nye"}
              </div>
              <div className="content">{text}</div>
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
          await sendMessage({ text });
        }}
      >
        <input
          value={input}
          placeholder="Ask Jimmy about his business..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status === "submitted" || status === "streaming"}
        />
        <button type="submit">Send</button>
      </form>

      {status !== "ready" && (
        <div className="status">Status: {status}</div>
      )}

      {error && <div className="error">{String(error.message ?? error)}</div>}
    </div>
  );
}
