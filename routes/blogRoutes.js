import express from "express";
import {
  getBlogs,
  getBlogBySlug,
  addBlogComment,
  toggleCommentLike,
} from "../controllers/blogController.js";

const router = express.Router();

// @route   GET /api/blogs
// @desc    Get all blogs with category filter
router.get("/", getBlogs);

// @route   GET /api/blogs/:slug
// @desc    Get single blog by slug
router.get("/:slug", getBlogBySlug);

// @route   POST /api/blogs/:slug/comments
// @desc    Add comment to blog
router.post("/:slug/comments", addBlogComment);

// @route   POST /api/blogs/:slug/comments/:commentId/like
// @desc    Toggle like on comment
router.post("/:slug/comments/:commentId/like", toggleCommentLike);

export default router;
