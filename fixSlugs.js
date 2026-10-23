import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Event from "./models/Event.js";

async function fixDuplicateSlugs() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for slug deduplication");

  const events = await Event.find({}).sort({ createdAt: 1, _id: 1 });
  const seenSlugs = new Set();

  for (const ev of events) {
    let base = (ev.slug || ev.title || "event")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (!base) base = "event";

    let candidate = base;
    let suffix = 1;

    while (seenSlugs.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    seenSlugs.add(candidate);

    if (ev.slug !== candidate) {
      console.log(`Updating event "${ev.title}" (id: ${ev.id}) slug from "${ev.slug}" -> "${candidate}"`);
      ev.slug = candidate;
      await ev.save();
    } else {
      console.log(`Event "${ev.title}" (id: ${ev.id}) already has unique slug "${candidate}"`);
    }
  }

  console.log("Deduplication completed!");
  await mongoose.disconnect();
}

fixDuplicateSlugs().catch((err) => {
  console.error("Error fixing slugs:", err);
  process.exit(1);
});
