import { notFound } from "next/navigation";
import { getGuestBySlug } from "@/lib/store";
import { siteUrl, inviteUrl } from "@/lib/site";
import { headers } from "next/headers";
import Invitation from "@/components/Invitation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const found = await getGuestBySlug(params.slug);
  return { title: found ? found.event.name : "Invitation", robots: { index: false, follow: false } };
}

export default async function InvitePage({ params }) {
  const found = await getGuestBySlug(params.slug);
  if (!found) notFound();
  const { guest, event } = found;
  const base = siteUrl({ headers: headers() });

  // Only what this guest needs reaches the browser.
  return (
    <Invitation
      slug={guest.slug}
      url={inviteUrl(base, guest)}
      guest={{
        name: guest.name, email: guest.email, phone: guest.phone,
        plusOneAllowed: guest.plusOneAllowed, rsvp: guest.rsvp,
      }}
      event={event}
    />
  );
}
