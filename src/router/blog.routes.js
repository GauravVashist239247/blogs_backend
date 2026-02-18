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
  getBlogStats,
  getAllBlogsById,
} = require("../controllers/blog.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

/**
 * PUBLIC ROUTES
 */
router.get("/", getAllBlogs);
router.get("/id/:id", getAllBlogsById);

router.get("/:slug", getBlogBySlug);
router.get("/admin/stats", protect, authorizeRoles("admin"), getBlogStats);

/**
 * AUTHOR / ADMIN ROUTES
 */
router.post("/", protect, authorizeRoles("author", "admin"), createBlog);

router.patch("/:id", protect, authorizeRoles("author", "admin"), updateBlog);

router.delete("/:id", protect, authorizeRoles("author", "admin"), deleteBlog);

/**
 * AUTHOR DASHBOARD
 */
router.get(
  "/author/me",
  protect,
  authorizeRoles("author", "admin"),
  getBlogsByAuthor,
);

/**
 * READER ACTION
 */
router.put(
  "/like/:id",
  protect,
  authorizeRoles("reader", "author", "admin"),
  toggleLikeBlog,
);

module.exports = router;
