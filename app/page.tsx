"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import "./jimmy-chat.css";

export default function JimmyChat() {
  // --- ADD THESE THREE LINES ---
  const [input, setInput] = useState(""); 
  const [persona, setPersona] = useState("jimmy");
  const [availablePersonas, setAvailablePersonas] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPersona = params.get("persona");
    if (urlPersona) setPersona(urlPersona);

    fetch("/api/personas")
      .then(res => res.json())
      .then(data => setAvailablePersonas(data))
      .catch(() => setAvailablePersonas(["jimmy"])); // Fallback
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat", 
    body: { persona }, // This sends the selected persona to route.ts
    onError: (e: any) => console.error("useChat error:", e),
  } as any);

  return (
    <div className="chat-container">
      <div className="header-row">
        <h1>Client Simulator</h1>
        
        {/* Dropdown Menu */}
        <select 
          value={persona} 
          onChange={(e) => setPersona(e.target.value)}
          className="persona-selector"
        >
          {availablePersonas.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="messages">
        {/* ... (Your existing mapping logic remains the same) ... */}
        {messages.map((m: any) => (
            <div key={m.id} className={`message ${m.role === "user" ? "user" : "bot"}`}>
               <div className="label">{m.role === "user" ? "Student" : persona}</div>
               <div className="content">
                {(m.parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("")}
               </div>
            </div>
        ))}
      </div>

      <form
        className="input-row"
        onSubmit={async (e: any) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;

          setInput("");
          await sendMessage({ text });
        }}
      >
        <input
          value={input}
          placeholder="Ask the client about their business needs..."
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
