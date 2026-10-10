import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { snapshot } from "@/lib/store";
import { siteUrl } from "@/lib/site";
import Invitation from "@/components/Invitation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitation preview", robots: { index: false, follow: false } };

// /amos shows the invitation as "Amos" without needing a guest record or emailed link.
// Nothing is saved: no open tracking, RSVPs are not stored. Real routes (/admin, /invite, /api) take precedence.
export default async function PreviewPage({ params }) {
  const raw = decodeURIComponent(params.name);
  if (!/^[a-z][a-z-]{0,29}$/i.test(raw)) notFound();
  const name = raw.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const { event } = await snapshot();

  return (
    <Invitation
      preview
      slug="preview"
      url={siteUrl({ headers: headers() })}
      guest={{ name, email: "", phone: "", plusOneAllowed: true, rsvp: null }}
      event={event}
    />
  );
}
