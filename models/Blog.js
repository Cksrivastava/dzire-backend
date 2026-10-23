import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, default: () => Date.now() },
  author: { type: String, required: true },
  email: { type: String, default: "" },
  date: { type: String, default: () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
  text: { type: String, required: true },
  likes: { type: Number, default: 0 },
});

const blogSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Adventure Tips",
    },
    author: {
      type: String,
      default: "Dzire Store",
    },
    authorBadge: {
      type: String,
      default: "[Author]",
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    },
    excerpt: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
    },
    visibility: {
      type: String,
      default: "web",
    },
    alert: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String }],
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1517821365201-7734f463f9e1?auto=format&fit=crop&w=1200&q=80",
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
