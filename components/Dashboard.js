"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MESSAGE_KINDS, STATUS_LABELS, computeStats, guestStatus, recipientsFor } from "@/lib/status";
import { isoToLocalInput, localInputToIso } from "@/lib/format";

const call = async (url, method, body) => {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }) : "–");

export default function Dashboard({ event, guests, mailLive }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const stats = useMemo(() => computeStats(guests), [guests]);
  const shown = filter === "all" ? guests : guests.filter((g) => guestStatus(g) === filter);

  const run = async (fn) => {
    try { setNote(await fn()); router.refresh(); } catch (e) { setNote(`Error: ${e.message}`); }
  };

  return (
    <main className="admin">
      <header>
        <img className="logo sm" src="/selar-logo.png" alt="Selar" />
        <h1>{event.name}</h1>
        <div>
          <a className="btn ghost sm" href="/api/admin/export">Export CSV</a>
          <button className="btn ghost sm" onClick={() => call("/api/admin/login", "DELETE").then(() => router.refresh())}>Sign out</button>
        </div>
      </header>

      {!mailLive && <p className="banner">Email is not connected (no <code>RESEND_API_KEY</code>). Sends are logged to the server console and no emails are delivered.</p>}
      {note && <p className="banner ok" role="status">{note}</p>}

      <section className="stats">
        {[["Invited", stats.invited], ["Sent", stats.sent], ["Delivered", stats.delivered], ["Opened", stats.opened],
          ["Attending", stats.attending], ["Not attending", stats.declined], ["No response", stats.pending], ["Headcount", stats.headcount]].map(([l, n]) => (
          <div key={l}><strong>{n}</strong><span>{l}</span></div>
        ))}
      </section>

      <Messages guests={guests} run={run} />
      <Import run={run} />
      <EventForm event={event} run={run} />

      <section className="card">
        <div className="row">
          <h2>Guests</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="scroll">
          <table>
            <thead><tr><th>Guest</th><th>Email</th><th>Status</th><th>RSVP</th><th>Plus one</th><th>Date</th><th>Link</th></tr></thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}{g.guestType && <small>{g.guestType}</small>}</td>
                  <td>{g.email}</td>
                  <td><span className={`pill ${guestStatus(g)}`}>{STATUS_LABELS[guestStatus(g)]}</span></td>
                  <td>{g.rsvp ? (g.rsvp.attending ? "Yes" : "No") : "Pending"}</td>
                  <td>{g.rsvp?.attending ? (g.rsvp.plusOne ? g.rsvp.plusOneName || "Yes" : "No") : "–"}</td>
                  <td>{fmt(g.rsvp?.at || g.sentAt)}</td>
                  <td><a href={`/invite/${g.slug}`} target="_blank" rel="noreferrer">Open</a></td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan="7" className="muted">No guests yet. Import a CSV above.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Messages({ guests, run }) {
  const [kind, setKind] = useState("invitation");
  const [message, setMessage] = useState("");
  const count = recipientsFor(kind, guests).length;

  const send = () => {
    if (!window.confirm(`You are about to send "${MESSAGE_KINDS[kind]}" to ${count} guest${count === 1 ? "" : "s"}. Continue?`)) return;
    run(async () => {
      const r = await call("/api/admin/send", "POST", { kind, message });
      const failed = r.failed.length ? ` ${r.failed.length} failed (${r.failed[0].error}).` : "";
      return `${r.simulated ? "Simulated" : "Sent"} ${r.sent} email${r.sent === 1 ? "" : "s"}.${failed}`;
    });
  };

  return (
    <section className="card">
      <h2>Send</h2>
      <div className="row">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.entries(MESSAGE_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn sm" disabled={count === 0 || (kind === "update" && !message.trim())} onClick={send}>
          Send to {count} guest{count === 1 ? "" : "s"}
        </button>
      </div>
      {kind === "update" && <textarea rows="4" placeholder="Write your update to confirmed guests…" value={message} onChange={(e) => setMessage(e.target.value)} />}
      <p className="muted">
        {{ invitation: "Guests who haven't been sent an invitation yet.", rsvp_reminder: "Invited guests who haven't responded.",
          day_before: "Guests who are attending. Send this the day before.", event_day: "Guests who are attending. Send this on the day.",
          update: "Guests who are attending." }[kind]}
      </p>
    </section>
  );
}

function Import({ run }) {
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const csv = await file.text();
    e.target.value = "";
    run(async () => {
      const r = await call("/api/admin/guests", "POST", { csv });
      const bad = r.errors.length ? ` Skipped ${r.errors.length}: ${r.errors.slice(0, 3).map((x) => `row ${x.row} (${x.reason})`).join("; ")}${r.errors.length > 3 ? "…" : ""}` : "";
      return `Imported ${r.added} guest${r.added === 1 ? "" : "s"}.${bad}`;
    });
  };
  return (
    <section className="card">
      <h2>Import guests</h2>
      <p className="muted">CSV with columns <code>Name, Email, Phone, Guest Type</code>. Optional: <code>Company, Role, Plus One Allowed</code>.</p>
      <input type="file" accept=".csv,text/csv" onChange={upload} />
    </section>
  );
}

function EventForm({ event, run }) {
  const [f, setF] = useState({
    name: event.name, tagline: event.tagline, description: event.description, venue: event.venue, address: event.address,
    coverImage: event.coverImage, startsAt: isoToLocalInput(event.startsAt), endsAt: isoToLocalInput(event.endsAt),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await call("/api/admin/event", "PUT", { ...f, startsAt: localInputToIso(f.startsAt), endsAt: localInputToIso(f.endsAt) });
      return "Event details saved. Every invitation now shows the update.";
    });
  };
  return (
    <details className="card">
      <summary><h2>Event details</h2></summary>
      <form onSubmit={save} className="grid">
        <label className="field">Event name<input value={f.name} onChange={set("name")} /></label>
        <label className="field">Tagline<input value={f.tagline} onChange={set("tagline")} /></label>
        <label className="field">Starts (Lagos time)<input type="datetime-local" value={f.startsAt} onChange={set("startsAt")} /></label>
        <label className="field">Ends (optional, defaults to 3 hours)<input type="datetime-local" value={f.endsAt} onChange={set("endsAt")} /></label>
        <label className="field">Venue<input value={f.venue} onChange={set("venue")} /></label>
        <label className="field">Address<input value={f.address} onChange={set("address")} /></label>
        <label className="field wide">Description<textarea rows="3" value={f.description} onChange={set("description")} /></label>
        <label className="field wide">Cover image URL (optional)<input value={f.coverImage} onChange={set("coverImage")} /></label>
        <button className="btn sm">Save</button>
      </form>
    </details>
  );
}
