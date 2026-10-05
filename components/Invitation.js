"use client";
import { useState } from "react";
import { formatDate, formatTime, mapsUrl } from "@/lib/format";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar";

const firstName = (n) => n.trim().split(/\s+/)[0] || n;

export default function Invitation({ slug, url, guest, event }) {
  const [stage, setStage] = useState("cover"); // cover | invitation | rsvp | done
  const [rsvp, setRsvp] = useState(guest.rsvp);

  function open() {
    fetch(`/api/invite/${slug}/open`, { method: "POST" }).catch(() => {});
    setStage(rsvp ? "done" : "invitation");
  }

  if (stage === "cover") {
    return (
      <main className="cover">
        <div className="cover-card rise">
          <p className="eyebrow">You&apos;re invited</p>
          <h1>{event.name}</h1>
          <p className="lede">Hi {firstName(guest.name)}, {event.tagline}</p>
          <button className="btn" onClick={open}>Open invitation</button>
        </div>
      </main>
    );
  }

  const Details = () => (
    <dl className="details">
      <div><dt>Date</dt><dd>{formatDate(event.startsAt)}</dd></div>
      <div><dt>Time</dt><dd>{formatTime(event.startsAt)}</dd></div>
      <div><dt>Venue</dt><dd>{event.venue}{event.address && <small>{event.address}</small>}</dd></div>
    </dl>
  );

  if (stage === "rsvp") {
    return (
      <main className="page">
        <RsvpForm
          slug={slug} guest={guest}
          onBack={() => setStage(rsvp ? "done" : "invitation")}
          onDone={(r) => { setRsvp(r); setStage("done"); }}
        />
      </main>
    );
  }

  if (stage === "done") {
    const yes = rsvp?.attending;
    return (
      <main className="page rise">
        <section className="panel center">
          <p className="eyebrow">{event.name}</p>
          <h1>{yes ? "You’re on the list." : "Thank you for letting us know."}</h1>
          <p className="lede">{yes ? "We look forward to celebrating with you." : "We’ll miss you. If your plans change, you can update your response any time."}</p>
          {yes && <Details />}
          {yes && event.startsAt && (
            <div className="actions">
              <a className="btn" href={googleCalendarUrl(event, url)} target="_blank" rel="noreferrer">Add to Google Calendar</a>
              <a className="btn ghost" href={`/invite/${slug}/calendar.ics`}>Add to Apple Calendar</a>
              <a className="btn ghost" href={outlookCalendarUrl(event, url)} target="_blank" rel="noreferrer">Add to Outlook</a>
            </div>
          )}
          <div className="actions">
            {yes && <a className="btn ghost" href={mapsUrl(event)} target="_blank" rel="noreferrer">Get directions</a>}
            {yes && <ShareButton event={event} />}
            <button className="link" onClick={() => setStage("rsvp")}>Change my response</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page rise">
      <section className="hero" style={event.coverImage ? { backgroundImage: `linear-gradient(rgba(20,20,43,.55),rgba(20,20,43,.85)),url(${event.coverImage})` } : undefined}>
        <p className="eyebrow">Hi {firstName(guest.name)}, you&apos;re invited</p>
        <h1>{event.name}</h1>
        <p className="lede">{event.description}</p>
      </section>
      <section className="panel">
        <Details />
        <div className="actions">
          <button className="btn" onClick={() => setStage("rsvp")}>RSVP</button>
          <a className="btn ghost" href={mapsUrl(event)} target="_blank" rel="noreferrer">View location</a>
        </div>
      </section>
      <section className="panel">
        <h2>A look back at the journey</h2>
        <p className="lede">The exhibition tells the story of the people, products and moments that shaped Selar.</p>
        <ul className="sections">
          {event.sections.map((s) => (
            <li key={s.title}><h3>{s.title}</h3><p>{s.body}</p></li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function ShareButton({ event }) {
  async function share() {
    const data = { title: event.name, text: `I’m attending the ${event.name}!` };
    try { navigator.share ? await navigator.share(data) : await navigator.clipboard.writeText(data.text); } catch {}
  }
  return <button className="btn ghost" onClick={share}>Share</button>;
}

function RsvpForm({ slug, guest, onBack, onDone }) {
  const prev = guest.rsvp;
  const [attending, setAttending] = useState(prev ? prev.attending : null);
  const [name, setName] = useState(prev?.name || guest.name);
  const [email, setEmail] = useState(prev?.email || guest.email);
  const [phone, setPhone] = useState(prev?.phone || guest.phone || "");
  const [plusOne, setPlusOne] = useState(prev?.plusOne || false);
  const [plusOneName, setPlusOneName] = useState(prev?.plusOneName || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/invite/${slug}/rsvp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending, name, email, phone, plusOne, plusOneName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      onDone(data.rsvp);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h1>Will you be joining us?</h1>
      <div className="choices">
        <label className={attending === true ? "on" : ""}><input type="radio" name="a" checked={attending === true} onChange={() => setAttending(true)} />Yes, I&apos;ll be there</label>
        <label className={attending === false ? "on" : ""}><input type="radio" name="a" checked={attending === false} onChange={() => setAttending(false)} />Sorry, I can&apos;t make it</label>
      </div>

      {attending && (
        <>
          <label className="field">Full name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
          <label className="field">Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label className="field">Phone number<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required /></label>
          {guest.plusOneAllowed && (
            <>
              <div className="choices">
                <span>Will you be bringing a guest?</span>
                <label className={plusOne ? "on" : ""}><input type="radio" name="p" checked={plusOne} onChange={() => setPlusOne(true)} />Yes</label>
                <label className={!plusOne ? "on" : ""}><input type="radio" name="p" checked={!plusOne} onChange={() => setPlusOne(false)} />No</label>
              </div>
              {plusOne && <label className="field">Guest name<input value={plusOneName} onChange={(e) => setPlusOneName(e.target.value)} required /></label>}
            </>
          )}
        </>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn" disabled={attending === null || busy}>{busy ? "Sending…" : "Send RSVP"}</button>
        <button type="button" className="link" onClick={onBack}>Back</button>
      </div>
    </form>
  );
}
