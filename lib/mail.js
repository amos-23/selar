// Sends through Resend when RESEND_API_KEY is set; otherwise logs the email so the flow can be tested locally.
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html, guestId }) {
  if (!mailConfigured()) {
    console.log(`[mail:simulated] to=${to} subject=${subject}`);
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Selar <invitations@example.com>",
        to,
        subject,
        html,
        tags: guestId ? [{ name: "guest", value: guestId }] : undefined,
      }),
    });
    if (!res.ok) return { ok: false, error: `Mail provider returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
