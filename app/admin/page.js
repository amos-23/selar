import { adminConfigured, isAdmin } from "@/lib/auth";
import { snapshot } from "@/lib/store";
import { mailConfigured } from "@/lib/mail";
import Dashboard from "@/components/Dashboard";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Selar Anniversary Exhibition", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="cover">
        <div className="cover-card">
          <h1>Admin is not set up</h1>
          <p className="lede">Set the <code>ADMIN_PASSWORD</code> environment variable and redeploy to enable this page.</p>
        </div>
      </main>
    );
  }
  if (!isAdmin()) return <LoginForm />;
  const { event, guests } = await snapshot();
  return <Dashboard event={event} guests={guests} mailLive={mailConfigured()} />;
}
