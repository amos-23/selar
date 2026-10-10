// Exhibition media room (photographs, videos, interviews). Empty until post-exhibition assets are approved.
// Item shape:
// {
//   id: "install-01", type: "image" | "video",
//   title: "…", caption: "…", alt: "…" (required for images),
//   src: "/exhibition/media/install-01.jpg" | "https://…",
//   poster: "…" (video, optional), captions: "/…vtt" (video, optional),
//   publicationStatus: "published" | "awaiting_asset" | "awaiting_copy" | "needs_verification" | "ready",
//   sortOrder: 1,
// }
export const media = [];
