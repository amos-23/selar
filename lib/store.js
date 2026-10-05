import fs from "node:fs/promises";
import path from "node:path";

// JSON-file persistence behind a tiny interface (snapshot / mutate). Fine for local use and a single server.
// On Vercel the filesystem is ephemeral, so swap this file for a real database (Postgres, Supabase, KV) before launch.
const FILE =
  process.env.DATA_FILE ||
  path.join(process.env.VERCEL ? "/tmp" : process.cwd(), ".data", "selar-invitations.json");

export const DEFAULT_EVENT = {
  name: "Selar Anniversary Exhibition",
  tagline: "A celebration of the journey, the people and the ideas that have shaped Selar.",
  description:
    "Join us as we celebrate another year of building, creating and making commerce possible for creators across Africa.",
  startsAt: null, // ISO string with +01:00 offset, set in /admin
  endsAt: null,
  venue: "Venue to be announced",
  address: "",
  coverImage: "",
  sections: [
    { title: "The Beginning", body: "How Selar started." },
    { title: "The Creators", body: "Stories from creators who have built businesses on Selar." },
    { title: "The Milestones", body: "The major moments in Selar's journey." },
    { title: "The Products", body: "How Selar's products have evolved." },
    { title: "The Future", body: "Where Selar is going next." },
  ],
};

async function read() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return { event: DEFAULT_EVENT, guests: [] };
    throw e;
  }
}

async function write(db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

let queue = Promise.resolve();

// Serialises read-modify-write so concurrent RSVPs don't clobber each other.
export function mutate(fn) {
  const run = queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export async function snapshot() {
  return read();
}

export async function getGuestBySlug(slug) {
  const { guests, event } = await read();
  const guest = guests.find((g) => g.slug === slug);
  return guest ? { guest, event } : null;
}
