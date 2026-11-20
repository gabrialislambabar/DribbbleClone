import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const force = process.argv.includes("--force");
const localSite = /localhost|127\.0\.0\.1/.test(siteUrl);

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with `npm run seed` (loads .env.local).",
  );
  process.exit(1);
}

if (!localSite && !force) {
  console.error(
    `Refusing to seed a non-local site (${siteUrl}). Re-run with --force if this is intentional.`,
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "password123";

const USER_SPECS = [
  {
    email: "maya@example.com",
    username: "maya_designs",
    display_name: "Maya Chen",
    bio: "Product designer focused on mobile fintech and design systems.",
    portfolio_url: "https://example.com/maya",
    designer: true,
  },
  {
    email: "leo@example.com",
    username: "leo_ui",
    display_name: "Leo Martins",
    bio: "UI engineer and dashboard nerd. I like data that moves.",
    portfolio_url: "https://example.com/leo",
    designer: true,
  },
  {
    email: "sana@example.com",
    username: "sana_brand",
    display_name: "Sana Okafor",
    bio: "Brand designer, illustrator, and occasional animator.",
    portfolio_url: "https://example.com/sana",
    designer: true,
  },
  {
    email: "alex@example.com",
    username: "alex_rivera",
    display_name: "Alex Rivera",
    bio: "Frontend developer collecting good interfaces.",
    portfolio_url: null,
    designer: false,
  },
  {
    email: "nina@example.com",
    username: "nina_k",
    display_name: "Nina Kowalski",
    bio: "Illustrator and type enthusiast.",
    portfolio_url: null,
    designer: false,
  },
  {
    email: "omar@example.com",
    username: "omar_studio",
    display_name: "Omar Haddad",
    bio: "Motion designer exploring loops and transitions.",
    portfolio_url: null,
    designer: false,
  },
];

const SHOT_PLANS = [
  {
    owner: 0,
    cover: 0,
    title: "Nebula Bank — Mobile App",
    description:
      "A calmer banking app: clear balances, thoughtful transfers, and a dark mode that does not shout.",
    category: "mobile-design",
    daysAgo: 1,
    tags: ["mobile", "fintech", "ui"],
    likes: [
      [1, 0],
      [2, 1],
      [3, 0],
      [4, 2],
      [5, 1],
    ],
    comments: [
      [1, 0, "The transfer flow is so clean. Great restraint on the color."],
      [4, 1, "That balance card treatment is lovely."],
      [5, 0, "Would love to see the empty states too."],
    ],
  },
  {
    owner: 1,
    cover: 1,
    title: "Atlas Analytics Dashboard",
    description:
      "A dense but readable analytics workspace with saved views, comparison ranges, and exportable reports.",
    category: "product-design",
    daysAgo: 22,
    tags: ["dashboard", "saas", "data"],
    likes: [
      [0, 18],
      [2, 20],
      [3, 16],
      [4, 19],
      [5, 17],
      [1, 21],
    ],
    comments: [
      [0, 20, "This is the density I want in every dashboard."],
      [3, 18, "The comparison range control is a great touch."],
    ],
  },
  {
    owner: 2,
    cover: 2,
    title: "Bloom Brand Identity",
    description:
      "A soft, optimistic identity for a plant subscription service: wordmark, packaging, and social templates.",
    category: "branding",
    daysAgo: 4,
    tags: ["branding", "identity", "logo"],
    likes: [
      [0, 3],
      [1, 1],
      [4, 2],
      [5, 1],
    ],
    comments: [
      [0, 2, "The packaging system feels so warm."],
      [2, 1, "That wordmark is doing a lot with very little."],
    ],
  },
  {
    owner: 0,
    cover: 3,
    title: "Orbit Landing Page",
    description:
      "A marketing page for a developer tool: crisp hierarchy, a live demo panel, and no stock-photo people.",
    category: "web-design",
    daysAgo: 6,
    tags: ["web", "landing", "saas"],
    likes: [
      [1, 5],
      [2, 2],
      [4, 4],
      [5, 3],
    ],
    comments: [
      [1, 4, "The demo panel placement is smart."],
      [5, 3, "Hero copy is tight. Nice work."],
    ],
  },
  {
    owner: 2,
    cover: 0,
    title: "Tiny Garden — Illustration Set",
    description: "A set of editorial illustrations about small habits and slow progress.",
    category: "illustration",
    daysAgo: 9,
    tags: ["illustration", "editorial", "nature"],
    likes: [
      [0, 7],
      [3, 6],
      [4, 8],
    ],
    comments: [
      [3, 7, "The texture on these is perfect."],
      [4, 6, "I would hang the second one on my wall."],
    ],
  },
  {
    owner: 1,
    cover: 2,
    title: "Pulse Motion Study",
    description:
      "A short motion exploration around loading, success, and error states for a health app.",
    category: "animation",
    daysAgo: 2,
    tags: ["animation", "motion", "loop"],
    likes: [
      [0, 1],
      [2, 0],
      [3, 1],
      [4, 0],
      [5, 1],
    ],
    comments: [
      [0, 1, "The easing on the success state is great."],
      [2, 0, "This would make a very satisfying loading screen."],
      [4, 1, "More of these please."],
    ],
  },
  {
    owner: 2,
    cover: 1,
    title: "Studio OS Design System",
    description:
      "A component library for a small studio: tokens, type scale, and documentation that people actually read.",
    category: "product-design",
    daysAgo: 15,
    tags: ["design-system", "components", "figma"],
    likes: [
      [0, 12],
      [1, 10],
      [4, 14],
      [5, 11],
    ],
    comments: [
      [0, 11, "The token naming is refreshingly boring, in the best way."],
      [1, 10, "Stealing the spacing scale."],
    ],
  },
  {
    owner: 1,
    cover: 3,
    title: "Wander Travel App",
    description:
      "A trip planner that keeps the itinerary visible without turning the map into a spreadsheet.",
    category: "mobile-design",
    daysAgo: 7,
    tags: ["mobile", "travel", "ux"],
    likes: [
      [0, 5],
      [2, 4],
      [5, 3],
    ],
    comments: [
      [0, 4, "The day-by-day switcher is really nice."],
      [2, 3, "Please ship this."],
    ],
  },
  {
    owner: 2,
    cover: 0,
    title: "Paper & Ink Portfolio",
    description:
      "A quiet portfolio for an editorial designer, built around large type and generous whitespace.",
    category: "web-design",
    daysAgo: 28,
    tags: ["portfolio", "editorial", "typography"],
    likes: [
      [1, 24],
      [3, 22],
    ],
    comments: [[1, 23, "The type scale is confident and calm."]],
  },
  {
    owner: 0,
    cover: 1,
    title: "Monogram Studies",
    description:
      "Twelve monograms for a fictional studio, exploring cuts, joins, and negative space.",
    category: "branding",
    daysAgo: 12,
    tags: ["branding", "monogram", "type"],
    likes: [
      [1, 10],
      [2, 8],
      [3, 9],
      [4, 7],
      [5, 8],
    ],
    comments: [
      [1, 8, "The fourth row is the strongest set."],
      [5, 7, "Really nice balance on the circular ones."],
    ],
  },
  {
    owner: 0,
    cover: 2,
    title: "Loop Loading Animations",
    description:
      "A collection of small loading loops designed to feel fast even when the network is not.",
    category: "animation",
    daysAgo: 3,
    tags: ["animation", "micro-interaction", "ui"],
    likes: [
      [3, 1],
      [4, 0],
    ],
    comments: [
      [3, 1, "The one on the right is my favorite."],
      [4, 0, "Great sense of rhythm."],
    ],
  },
  {
    owner: 1,
    cover: 3,
    title: "Field Notes — Illustration",
    description:
      "Sketchbook illustrations from a week of looking closely at ordinary things.",
    category: "illustration",
    daysAgo: 18,
    tags: ["illustration", "sketch", "journal"],
    likes: [
      [0, 16],
      [2, 15],
      [4, 14],
    ],
    comments: [[2, 15, "These have such a good sense of place."]],
  },
];

const FOLLOW_PAIRS = [
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 2],
  [2, 0],
  [2, 1],
  [3, 0],
  [3, 1],
  [3, 2],
  [4, 0],
  [4, 2],
  [5, 0],
  [5, 1],
];

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) {
      return found;
    }

    if (data.users.length < 200) {
      return null;
    }
  }
}

async function ensureUser(spec) {
  const existing = await findUserByEmail(spec.email);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: spec.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: spec.username,
      display_name: spec.display_name,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function removeUserCovers(userId) {
  const bucket = supabase.storage.from("shot-covers");
  const { data: folders } = await bucket.list(userId, { limit: 1000 });

  for (const folder of folders ?? []) {
    if (folder.id) {
      await bucket.remove([`${userId}/${folder.name}`]);
      continue;
    }

    const { data: files } = await bucket.list(`${userId}/${folder.name}`, {
      limit: 1000,
    });
    const paths = (files ?? [])
      .filter((file) => file.id)
      .map((file) => `${userId}/${folder.name}/${file.name}`);

    if (paths.length > 0) {
      await bucket.remove(paths);
    }
  }
}

async function loadTagMap() {
  const { data, error } = await supabase.from("tags").select("id, name");
  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((tag) => [tag.name.toLowerCase(), tag.id]));
}

async function ensureTag(tagMap, name) {
  const key = name.toLowerCase();
  if (tagMap.has(key)) {
    return tagMap.get(key);
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({ name })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  tagMap.set(key, data.id);
  return data.id;
}

async function main() {
  console.log(`Seeding ${url}`);
  console.log("Ensuring demo users…");

  const users = [];
  for (const spec of USER_SPECS) {
    const authUser = await ensureUser(spec);
    users.push({ spec, auth: authUser });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!profile) {
      const { error } = await supabase.from("profiles").insert({
        id: authUser.id,
        username: spec.username,
        display_name: spec.display_name,
        bio: spec.bio,
        portfolio_url: spec.portfolio_url,
      });
      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: spec.display_name,
          bio: spec.bio,
          portfolio_url: spec.portfolio_url,
        })
        .eq("id", authUser.id);
      if (error) {
        throw error;
      }
    }
  }

  const ids = users.map((user) => user.auth.id);
  const designerIds = users
    .filter((user) => user.spec.designer)
    .map((user) => user.auth.id);

  console.log("Cleaning previous demo shots and follows…");
  for (const id of ids) {
    await removeUserCovers(id);
  }

  await supabase.from("follows").delete().in("follower_id", ids);
  await supabase.from("follows").delete().in("following_id", ids);

  const { error: deleteError } = await supabase
    .from("shots")
    .delete()
    .in("creator_id", ids);
  if (deleteError) {
    throw deleteError;
  }

  const tagMap = await loadTagMap();
  const covers = await Promise.all(
    [1, 2, 3, 4].map((index) =>
      readFile(path.join(here, "seed-assets", `cover-${index}.png`)),
    ),
  );

  console.log(`Creating ${SHOT_PLANS.length} shots…`);

  for (const plan of SHOT_PLANS) {
    const owner = users[plan.owner].auth;
    const cover = covers[plan.cover % covers.length];
    const coverPath = `${owner.id}/${randomUUID()}/cover.png`;
    const { error: uploadError } = await supabase.storage
      .from("shot-covers")
      .upload(coverPath, cover, { contentType: "image/png", upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const publishedAt = daysAgo(plan.daysAgo);
    const { data: shot, error: shotError } = await supabase
      .from("shots")
      .insert({
        creator_id: owner.id,
        category_id: plan.category,
        title: plan.title,
        description: plan.description,
        cover_image_path: coverPath,
        status: "published",
        created_at: daysAgo(plan.daysAgo + 1),
        published_at: publishedAt,
      })
      .select("id")
      .single();

    if (shotError) {
      throw shotError;
    }

    const shotTagRows = [];
    for (const tagName of plan.tags) {
      const tagId = await ensureTag(tagMap, tagName);
      shotTagRows.push({ shot_id: shot.id, tag_id: tagId });
    }
    if (shotTagRows.length > 0) {
      const { error } = await supabase.from("shot_tags").insert(shotTagRows);
      if (error) {
        throw error;
      }
    }

    if (plan.likes.length > 0) {
      const { error } = await supabase.from("shot_likes").upsert(
        plan.likes.map(([userIndex, likeDaysAgo]) => ({
          user_id: users[userIndex].auth.id,
          shot_id: shot.id,
          created_at: daysAgo(likeDaysAgo),
        })),
        { onConflict: "user_id,shot_id", ignoreDuplicates: true },
      );
      if (error) {
        throw error;
      }
    }

    if (plan.comments.length > 0) {
      const { error } = await supabase.from("comments").insert(
        plan.comments.map(([userIndex, commentDaysAgo, body]) => ({
          shot_id: shot.id,
          author_id: users[userIndex].auth.id,
          body,
          created_at: daysAgo(commentDaysAgo),
          updated_at: daysAgo(commentDaysAgo),
        })),
      );
      if (error) {
        throw error;
      }
    }
  }

  console.log("Creating follows…");
  const { error: followError } = await supabase.from("follows").upsert(
    FOLLOW_PAIRS.map(([follower, following]) => ({
      follower_id: users[follower].auth.id,
      following_id: users[following].auth.id,
    })),
    { onConflict: "follower_id,following_id", ignoreDuplicates: true },
  );
  if (followError) {
    throw followError;
  }

  const { data: counts } = await supabase
    .from("shots")
    .select("like_count, comment_count")
    .in("creator_id", designerIds);

  const totalLikes = (counts ?? []).reduce((sum, shot) => sum + shot.like_count, 0);
  const totalComments = (counts ?? []).reduce((sum, shot) => sum + shot.comment_count, 0);

  console.log("\nSeed complete");
  console.log(
    `  users:    ${users.length} (${users.filter((u) => u.spec.designer).length} designers)`,
  );
  console.log(`  shots:    ${SHOT_PLANS.length}`);
  console.log(`  likes:    ${totalLikes}`);
  console.log(`  comments: ${totalComments}`);
  console.log(`  follows:  ${FOLLOW_PAIRS.length}`);
  console.log("\nDemo password for every account:", PASSWORD);
  for (const user of users) {
    console.log(`  ${user.spec.email}  →  /u/${user.spec.username}`);
  }
  console.log(
    "\nFeeds are cached for up to 60 seconds; refresh or wait a moment to see the seed.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
