import Blog from "../models/Blog.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

// @desc    Get all blogs with category filter & search
// @route   GET /api/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    if (getDbStatus()) {
      const filter = {};
      if (category && category !== "All") {
        filter.$or = [
          { category: new RegExp(category, "i") },
          { title: new RegExp(category, "i") },
        ];
      }
      if (search) {
        filter.$or = [
          { title: new RegExp(search, "i") },
          { excerpt: new RegExp(search, "i") },
          { category: new RegExp(search, "i") },
        ];
      }
      const blogs = await Blog.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: blogs.length, blogs });
    } else {
      let blogs = [...(memoryStore.blogs || [])];
      if (category && category !== "All") {
        const c = category.toLowerCase();
        blogs = blogs.filter(
          (b) => (b.category && b.category.toLowerCase().includes(c)) || (b.title && b.title.toLowerCase().includes(c))
        );
      }
      if (search) {
        const q = search.toLowerCase();
        blogs = blogs.filter(
          (b) =>
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
            (b.category && b.category.toLowerCase().includes(q))
        );
      }
      return res.json({ success: true, count: blogs.length, blogs });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const isObjectId = typeof slug === "string" && /^[0-9a-fA-F]{24}$/.test(slug);

    if (getDbStatus()) {
      const orConditions = [
        { slug: String(slug) },
        { id: String(slug) },
      ];
      if (isObjectId) {
        orConditions.push({ _id: slug });
      }

      const blog = await Blog.findOne({ $or: orConditions });
      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog not found" });
      }
      return res.json({ success: true, blog, post: blog });
    } else {
      const blog = (memoryStore.blogs || []).find(
        (b) =>
          b.slug === slug ||
          String(b.id) === String(slug) ||
          String(b._id) === String(slug)
      ) || (memoryStore.blogs && memoryStore.blogs[0]);

      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog not found" });
      }
      return res.json({ success: true, blog, post: blog });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to blog
// @route   POST /api/blogs/:slug/comments
export const addBlogComment = async (req, res, next) => {
  try {
    const { author, email, text } = req.body;
    const { slug } = req.params;
    const isObjectId = typeof slug === "string" && /^[0-9a-fA-F]{24}$/.test(slug);

    const newComment = {
      id: Date.now(),
      author: author?.trim() || "Anonymous",
      email: email?.trim() || "",
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      text: text?.trim() || "",
      likes: 0,
    };

    if (getDbStatus()) {
      const orConditions = [{ slug: String(slug) }, { id: String(slug) }];
      if (isObjectId) orConditions.push({ _id: slug });
      const blog = await Blog.findOne({ $or: orConditions });
      if (blog) {
        blog.comments.unshift(newComment);
        await blog.save();
        return res.status(201).json({ success: true, comments: blog.comments });
      }
    } else {
      const blog = (memoryStore.blogs || []).find(
        (b) => b.slug === slug || String(b.id) === String(slug) || String(b._id) === String(slug)
      );
      if (blog) {
        if (!blog.comments) blog.comments = [];
        blog.comments.unshift(newComment);
        return res.status(201).json({ success: true, comments: blog.comments });
      }
    }

    res.status(201).json({
      success: true,
      comments: [newComment],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on comment
// @route   POST /api/blogs/:slug/comments/:commentId/like
export const toggleCommentLike = async (req, res, next) => {
  try {
    const { slug, commentId } = req.params;
    const { liked } = req.body;
    const isObjectId = typeof slug === "string" && /^[0-9a-fA-F]{24}$/.test(slug);

    if (getDbStatus()) {
      const orConditions = [{ slug: String(slug) }, { id: String(slug) }];
      if (isObjectId) orConditions.push({ _id: slug });
      const blog = await Blog.findOne({ $or: orConditions });
      if (blog) {
        const comment = blog.comments.find((c) => String(c.id) === String(commentId));
        if (comment) {
          comment.likes = liked ? (comment.likes || 0) + 1 : Math.max(0, (comment.likes || 1) - 1);
          await blog.save();
        }
        return res.json({ success: true, comments: blog.comments });
      }
    } else {
      const blog = (memoryStore.blogs || []).find(
        (b) => b.slug === slug || String(b.id) === String(slug) || String(b._id) === String(slug)
      );
      if (blog) {
        const comment = (blog.comments || []).find((c) => String(c.id) === String(commentId));
        if (comment) {
          comment.likes = liked ? (comment.likes || 0) + 1 : Math.max(0, (comment.likes || 1) - 1);
        }
        return res.json({ success: true, comments: blog.comments });
      }
    }

    res.json({ success: true, comments: [] });
  } catch (error) {
    next(error);
  }
};
