"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else setError((await res.json()).error);
  }

  return (
    <main className="cover">
      <form className="cover-card" onSubmit={submit}>
        <p className="eyebrow">Selar Anniversary Exhibition</p>
        <h1>Team sign in</h1>
        <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Sign in</button>
      </form>
    </main>
  );
}
