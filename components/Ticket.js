export default function Ticket({ event, guest, plusOnes, code }) {
  const d = new Date(event.date);
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <article className="ticket">
      <div className="main">
        <p className="eyebrow">You&apos;re invited</p>
        <h1>{event.title}</h1>
        <p className="guest">for <strong>{guest}</strong>{plusOnes > 0 && ` + ${plusOnes}`}</p>
        <p className="msg">{event.message}</p>
        <dl>
          <div><dt>Date</dt><dd>{date}</dd></div>
          <div><dt>Time</dt><dd>{time}</dd></div>
          <div><dt>Venue</dt><dd>{event.venue}</dd></div>
        </dl>
        <p className="host">Hosted by {event.host}</p>
      </div>
      <div className="stub">
        <p className="eyebrow">Admit {1 + plusOnes}</p>
        <div className="code">{code}</div>
        <p className="small">Show this code at the door</p>
      </div>
    </article>
  );
}
