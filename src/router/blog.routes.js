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
} = require("../controllers/blog.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

/**
 * PUBLIC ROUTES
 */
router.get("/", getAllBlogs);
router.get("/:slug", getBlogBySlug);

/**
 * AUTHOR / ADMIN ROUTES
 */
router.post("/", protect, authorizeRoles("author", "admin"), createBlog);

router.put("/:id", protect, authorizeRoles("author", "admin"), updateBlog);

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
