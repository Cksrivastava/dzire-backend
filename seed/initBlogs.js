import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Blog from "../models/Blog.js";

const initialBlogs = [
  {
    id: "blog-1",
    slug: "kedarkantha-trek",
    category: "Adventure Tips",
    title: "Kedarkantha Trek – What to Pack and Things to Consider",
    excerpt:
      "Kedarkantha Trek – What to Pack? If you’re planning the Kedarkantha Trek, congratulations — you’re about to experience one of India’s most scenic winter treks! Known for its stunning snow trails, charming campsites, and 360° Himalayan summit views, Kedarkantha is perfect for both beginners and seasoned trekkers.",
    image:
      "https://images.unsplash.com/photo-1517821365201-7734f463f9e1?auto=format&fit=crop&w=1200&q=80",
    date: "Tue, 20 Oct'26",
    author: "Dzire Store",
    content: `
Kedarkantha Trek – What to Pack? If you’re planning the Kedarkantha Trek, congratulations — you’re about to experience one of India’s most scenic winter treks! Known for its stunning snow trails, charming campsites, and 360° Himalayan summit views, Kedarkantha is perfect for both beginners and seasoned trekkers.

But before you hit the trail, packing right is one of the most important steps. The weather in the mountains can change quickly, and carrying the right essentials will make your trek safer, warmer, and much more comfortable.

Start with proper clothing. Carry thermal innerwear, fleece jackets, a padded down jacket, trekking pants, woolen socks, gloves, and a warm cap. Layering is the best way to stay comfortable because you can adjust clothes based on the weather and trekking intensity.

Footwear matters a lot. Invest in good trekking shoes with ankle support and a strong grip. Snowy and uneven trails can be slippery, so shoes should be waterproof if possible.

Do not forget your backpack essentials. Carry a rain cover, water bottle, torch, sunglasses, sunscreen, lip balm, personal medicines, power bank, and light snacks. Trekking poles can also help reduce strain on your knees during steep climbs and descents.

Another important thing to consider is fitness. Kedarkantha is beginner-friendly, but basic stamina and leg strength will make the journey much easier. Start light walking, stair climbing, and stretching a few weeks before your trek.

Lastly, always pack light but smart. Avoid unnecessary items and focus on comfort, warmth, and safety. With the right preparation, Kedarkantha becomes an unforgettable adventure.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
    comments: [
      {
        id: 1,
        author: "Rohan Sharma",
        email: "rohan@example.com",
        date: "12 Nov 2026",
        text: "Very helpful guide! I'm planning to trek to Kedarkantha next month and this packing list was super useful.",
        likes: 5,
      },
      {
        id: 2,
        author: "Priya Patel",
        email: "priya@example.com",
        date: "14 Nov 2026",
        text: "Trekking poles are definitely a lifesaver on the descent. Thanks for sharing these details!",
        likes: 3,
      },
    ],
  },
  {
    id: "blog-2",
    slug: "hiking-trekking-mountaineering",
    category: "Gear Guides",
    title:
      "The Ultimate Guide to Hiking, Trekking, and Mountaineering: Meaning, Gear & Key Differences",
    excerpt:
      "Hiking, Trekking & Mountaineering — What’s the Difference? If you love the outdoors, you’ve probably heard the terms hiking, trekking, and mountaineering used interchangeably. While they might sound similar, each one represents a different level of adventure, challenge, and preparation.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    date: "Mon, 19 Oct'26",
    author: "Dzire Store",
    content: `
Hiking, Trekking & Mountaineering — What’s the Difference? If you love the outdoors, you’ve probably heard these terms used interchangeably. While they sound similar, they are actually quite different in terms of difficulty, gear, and overall experience.

Hiking usually refers to walking on well-marked trails or nature paths for a shorter duration. It is great for beginners and generally needs basic gear like good shoes, a small backpack, water, and weather-appropriate clothing.

Trekking is more demanding. It often involves multi-day journeys on rougher terrain, including hills, forests, snow paths, or remote routes. Trekkers need better fitness, stronger shoes, larger backpacks, trekking poles, layered clothing, and camping essentials depending on the route.

Mountaineering is the most advanced level. It involves climbing mountains, often at high altitude, and may require technical skills, ropes, harnesses, helmets, crampons, and ice axes. It demands training, planning, and often the guidance of professionals.

Understanding these differences helps you choose the right adventure and prepare properly. A beginner may start with hiking, then move into trekking, and eventually explore mountaineering.

The right gear depends on the activity. For hiking, keep it simple and light. For trekking, focus on durability and comfort. For mountaineering, safety and technical equipment become essential.

No matter which adventure you choose, respect nature, plan ahead, and always prioritise safety.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-3",
    slug: "shock-absorption-trekking-poles",
    category: "Adventure Tips",
    title: "Why Shock-Absorption Trekking Poles Are Essential for Every Trekker",
    excerpt:
      "When you think of trekking essentials, most people focus on shoes, jackets, and backpacks. But one of the most underrated trekking gear items is the Trekking Pole – especially the Shock-Absorption Trekking Pole. If you’re trekking in Sahyadris, Himalayas, or anywhere with uneven terrain, using a trekking pole isn’t just a convenience — it’s a necessity.",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80",
    date: "Mon, 02 Nov'26",
    author: "Dzire Store",
    content: `
When you think of trekking essentials, most people focus on shoes, jackets, and backpacks. But one of the most underrated trekking gear items is the Trekking Pole — especially the Shock-Absorption Trekking Pole.

If you’re trekking in Sahyadris, Himalayas, or anywhere with uneven terrain, using a trekking pole isn’t just a convenience — it’s a smart support system for your body.

Shock-absorption trekking poles help reduce the pressure on your knees, ankles, and joints, especially while descending steep trails. This makes a huge difference on long treks where fatigue builds up quickly.

They also improve balance and stability. On rocky sections, muddy slopes, or snow trails, poles help you maintain control and reduce the chance of slipping. For beginners, this added support can boost confidence on difficult terrain.

Another advantage is rhythm. Trekking poles help you maintain a steady pace and distribute effort across both your upper and lower body. That means less strain on the legs and better endurance over time.

When choosing a trekking pole, look for adjustable height, a comfortable grip, durable material, and a reliable locking system. Shock-absorption features are especially useful for people who trek frequently or carry heavier backpacks.

A good trekking pole is not just an accessory — it becomes part of your trekking technique. Once you get used to it, you’ll feel the difference on every trail.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-4",
    slug: "how-to-pack-backpack",
    category: "Gear Guides",
    title: "How to Pack a Backpack for a 4–7 Day Trek",
    excerpt:
      "How to Pack a Backpack for a 4–7 Day Trek? Packing smartly is key to a comfortable, safe, and enjoyable journey. Whether you’re trekking in the Himalayas or exploring the Sahyadris, a well-organized backpack ensures balance, accessibility, and protection for your essentials.",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    date: "Mon, 19 Oct'26",
    author: "Dzire Store",
    content: `
How to Pack a Backpack for a 4–7 Day Trek? Packing smartly is the key to a comfortable and successful trek.

Keep heavy items close to your back and near the middle of the backpack. This helps maintain balance and reduces strain. Sleeping bags and items you won’t need during the day should go at the bottom.

Frequently used items like water, snacks, rain jacket, sunglasses, sunscreen, and first-aid kit should be easy to access. Use side pockets and top compartments wisely.

Distribute weight evenly. Avoid packing too much on one side. Compression straps can help keep everything secure.

Use dry bags or zip pouches to protect clothing and electronics from rain. Neat packing also saves time while unpacking at campsites.

A well-packed bag feels lighter, safer, and much easier to carry over long distances.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-5",
    slug: "trekking-essentials-beginners",
    category: "Gear Guides",
    title: "Top 10 Must-Have Trekking Essentials for Beginners",
    excerpt:
      "Top 10 Must-Have Trekking Essentials for Beginners — Planning your first trek? Here are the 10 Must-Have Trekking Essentials for Beginners — from backpacks to jackets. Stay ready for every trail with Dzire Store India.",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
    date: "Mon, 19 Oct'26",
    author: "Dzire Store",
    content: `
Planning your first trek? Packing the right essentials can make your journey smoother and more enjoyable.

Your basic trekking checklist should include trekking shoes, backpack, water bottle, warm clothing, rain protection, cap, gloves, flashlight, personal medicines, and energy snacks.

Beginners often overpack, but smart packing matters more than carrying too much. Choose light, durable, and useful items.

Focus on comfort, weather protection, and safety. Once you have the basics covered, your first trekking experience becomes much more enjoyable and stress-free.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-6",
    slug: "perfect-trekking-backpack",
    category: "Adventure Tips",
    title: "How to Choose the Perfect Trekking Backpack",
    excerpt:
      "Discover how to select the ideal trekking backpack for your adventure. Learn about sizes, features, and tips to pack smart for Sahyadri and Himalayan treks.",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
    date: "Sun, 20 Sep'26",
    author: "Dzire Store",
    content: `
Choosing the perfect trekking backpack depends on trek duration, body comfort, and packing style.

For short hikes, a 20–30L bag may be enough. For multi-day treks, 40–60L is usually more suitable. Look for padded shoulder straps, proper back support, chest and waist belts, and water resistance.

Always try a backpack for comfort. The right backpack should feel secure and balanced, not bulky and painful.

A good trekking backpack keeps your gear safe and your movement comfortable throughout the journey.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-7",
    slug: "trek-to-kalsubai",
    category: "Treks & Trails",
    title: "Trek to Kalsubai: Dzire Store x SG-Trekkers",
    excerpt:
      "Dzire Store is thrilled to announce a special collaboration and promotion event with SG-Trekkers — and what better way to celebrate than with an adventurous trek to the highest peak of Maharashtra, Kalsubai (5,400 ft)!",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
    date: "Fri, 02 Oct'26",
    author: "Dzire Store",
    content: `
Dzire Store is thrilled to announce a special collaboration event with SG-Trekkers.

What better way to celebrate than with an adventurous trek to the highest peak of Maharashtra, Kalsubai.

This event is not just a trek — it’s a celebration of our website launch and our passion for outdoor adventure.

We welcome every trekking enthusiast to join us for an inspiring mountain expedition.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
  {
    id: "blog-8",
    slug: "measuring-right-size-of-trekking-shoes",
    category: "Adventure Tips",
    title: "Measuring Right Size of Trekking Shoes",
    excerpt:
      "How to Choose the Perfect Trekking Shoe Size – Ultimate Guide. Choosing the right trekking shoe size is one of the most important steps before heading out on any adventure. Whether you’re planning a Himalayan trek or a weekend hike.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    date: "Thu, 01 Oct'26",
    author: "Dzire Store",
    content: `
Choosing the right trekking shoe size is one of the most important steps before heading out on any adventure.

The right shoes provide comfort, stability, and protection on rough terrain.

Always try shoes with trekking socks, check toe space, heel grip, and walk around before buying.

A properly fitted trekking shoe can prevent blisters and improve your trekking experience.
    `,
    status: "Published",
    visibility: "web",
    featured: true,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  for (const item of initialBlogs) {
    const existing = await Blog.findOne({ $or: [{ id: item.id }, { slug: item.slug }] });
    if (!existing) {
      await Blog.create(item);
      console.log(`Created blog: ${item.title}`);
    } else {
      // update content if needed
      await Blog.updateOne({ _id: existing._id }, { $set: item });
      console.log(`Updated blog: ${item.title}`);
    }
  }

  const count = await Blog.countDocuments();
  console.log(`Total blogs in database: ${count}`);
  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
