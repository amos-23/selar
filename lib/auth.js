import crypto from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "selar_admin";
const sha = (s) => crypto.createHash("sha256").update(s).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

// Admin is disabled until ADMIN_PASSWORD is set, so a fresh deploy is never open by accident.
export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export function sessionToken() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  return crypto.createHmac("sha256", secret).update("selar-admin-v1").digest("hex");
}

export const checkPassword = (input) => adminConfigured() && same(String(input ?? ""), process.env.ADMIN_PASSWORD);

export function isAdmin() {
  if (!adminConfigured()) return false;
  const c = cookies().get(COOKIE)?.value;
  return Boolean(c) && same(c, sessionToken());
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
