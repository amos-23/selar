import { notFound } from "next/navigation";
import { getEvent, ticketCode } from "@/lib/events";
import Ticket from "@/components/Ticket";

export async function generateMetadata({ params, searchParams }) {
  const event = getEvent(params.event);
  if (!event) return {};
  const name = searchParams.name?.toString().slice(0, 60);
  return {
    title: name ? `${name}, you're invited to ${event.title}` : event.title,
    description: event.message,
  };
}

export default function InvitePage({ params, searchParams }) {
  const event = getEvent(params.event);
  if (!event) notFound();

  const guest = (searchParams.name ?? "Guest").toString().slice(0, 60);
  const plusOnes = Math.min(Math.max(parseInt(searchParams.plus ?? "0", 10) || 0, 0), 10);
  const code = ticketCode(params.event, guest);

  return (
    <main className="stage" style={{ "--from": event.theme.from, "--to": event.theme.to }}>
      <Ticket event={event} guest={guest} plusOnes={plusOnes} code={code} />
    </main>
  );
}
