"use client";
import { useState } from "react";
import { events } from "@/lib/events";

export default function Home() {
  const [event, setEvent] = useState(Object.keys(events)[0]);
  const [name, setName] = useState("");
  const [plus, setPlus] = useState(0);

  const path = `/invite/${event}?name=${encodeURIComponent(name || "Guest")}&plus=${plus}`;

  return (
    <main className="stage" style={{ "--from": "#1f2937", "--to": "#4b5563" }}>
      <form className="card" onSubmit={(e) => e.preventDefault()}>
        <h1>Create a ticket invite</h1>
        <label>Event
          <select value={event} onChange={(e) => setEvent(e.target.value)}>
            {Object.entries(events).map(([k, v]) => <option key={k} value={k}>{v.title}</option>)}
          </select>
        </label>
        <label>Guest name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" />
        </label>
        <label>Plus ones
          <input type="number" min="0" max="10" value={plus} onChange={(e) => setPlus(e.target.value)} />
        </label>
        <a className="btn" href={path} target="_blank" rel="noreferrer">Preview invite</a>
        <code className="link">{path}</code>
      </form>
    </main>
  );
}
