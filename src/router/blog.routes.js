const express = require("express");
const router = express.Router();

const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
  getBlogsByAuthor,
  getAllBlogsById,
  searchBlogs,
} = require("../controllers/blog.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// Create blog
router.post(
  "/",
  protect,
  upload.single("image"),
  authorizeRoles("admin", "author"),
  createBlog,
);

// Get all blogs
router.get("/", getAllBlogs);

// Search blogs (clean REST way)
router.get("/search", searchBlogs);

router.get("/id/:id", getAllBlogsById);

// Get blog by slug
router.get("/:slug", getBlogBySlug);

// Update blog
router.patch("/:id", protect, authorizeRoles("admin", "author"), updateBlog);

// Delete blog
router.delete("/:id", protect, authorizeRoles("admin", "author"), deleteBlog);

// Like blog
router.put("/like/:id", protect, toggleLikeBlog);

// Author dashboard
router.get(
  "/author/me",
  protect,
  authorizeRoles("admin", "author"),
  getBlogsByAuthor,
);

module.exports = router;
