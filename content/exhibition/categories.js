// Hall of Fame categories (PRD 8.5) and the exhibition spaces built from them (PRD 7.2).
// Intro lines are proposed copy until approved.
export const categories = [
  { slug: "fastest-sales", title: "Fastest Sales", intro: "Launches that found their audience almost immediately." },
  { slug: "consistency-streak", title: "Consistency Streak", intro: "Creators who kept selling, month after month and day after day." },
  { slug: "top-monthly-sales", title: "Top Monthly Sales", intro: "The biggest single months on record." },
  { slug: "global-reach", title: "Global Reach", intro: "African creators selling to customers around the world." },
  { slug: "product-excellence", title: "Product Excellence", intro: "The products that sold the most." },
  { slug: "affiliate-legend", title: "Affiliate Legend", intro: "The affiliates who brought buyers to Selar creators." },
  { slug: "selar-firsts", title: "Selar Firsts", intro: "The first creators, affiliates and moments on Selar." },
  { slug: "category-leaders", title: "Category Leaders", intro: "The leading product in each category." },
  { slug: "ecosystem-impact", title: "Ecosystem Impact", intro: "Recognition for the people who strengthen the ecosystem." },
  { slug: "creator-of-the-year", title: "Creator of the Year", intro: "One creator recognised for each year, 2016 to 2025." },
];

// Thematic collections: digital groupings of the same exhibits (not a claim about the physical room layout).
export const collections = [
  { slug: "numbers", number: 5, title: "The Numbers That Tell Our Story", theme: "purple",
    intro: "Speed, consistency, volume and reach: the figures behind a decade of creator sales.",
    categories: ["fastest-sales", "consistency-streak", "top-monthly-sales", "global-reach"] },
  { slug: "firsts", number: 6, title: "The Firsts", theme: "blush",
    intro: "Where it started: first creators, first affiliates and first communities.",
    categories: ["selar-firsts"] },
  { slug: "products", number: 7, title: "The Products That Made History", theme: "grey",
    intro: "The digital products that led their categories and sold the most.",
    categories: ["product-excellence", "category-leaders"] },
  { slug: "people", number: 8, title: "The People Behind the Ecosystem", theme: "deep",
    intro: "Affiliates, mentors and community builders who carry the ecosystem.",
    categories: ["affiliate-legend", "ecosystem-impact"] },
  { slug: "decade", number: 9, title: "A Decade of Creativity", theme: "yellow",
    intro: "Ten years, ten Creators of the Year.",
    categories: ["creator-of-the-year"] },
];

// The suggested guided route through the exhibition (each stop links to the next).
export const tour = [
  { href: "/exhibition/about", label: "The Exhibition Statement" },
  { href: "/exhibition/hall-of-fame", label: "The Hall of Fame" },
  { href: "/exhibition/collections/numbers", label: "The Numbers That Tell Our Story" },
  { href: "/exhibition/collections/firsts", label: "The Firsts" },
  { href: "/exhibition/collections/products", label: "The Products That Made History" },
  { href: "/exhibition/collections/people", label: "The People Behind the Ecosystem" },
  { href: "/exhibition/collections/decade", label: "A Decade of Creativity" },
  { href: "/exhibition/timeline", label: "The Timeline" },
  { href: "/exhibition/highlights", label: "Inside the Exhibition", optional: "media" },
  { href: "/exhibition/closing", label: "The Closing Reflection" },
];
