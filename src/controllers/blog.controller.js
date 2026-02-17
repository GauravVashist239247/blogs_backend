const Blog = require("../models/blog.models");
const slugify = require("slugify");

/**
 * CREATE BLOG
 * Author / Admin
 */
const createBlog = async (req, res) => {
  try {
    const { title, content, category, tags, status } = req.body;

    const blog = await Blog.create({
      title,
      slug: slugify(title, { lower: true }),
      content,
      category,
      tags,
      status,
      author: req.user.id, // from auth middleware
      coverImage: req.file?.path,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET ALL BLOGS
 * Public
 */
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET SINGLE BLOG BY SLUG
 * Public
 */
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "name")
      .populate("category", "name");

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // increase views
    blog.views += 1;
    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE BLOG
 * Author (own blog) / Admin
 */
const updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // only author or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updatedData = {
      ...req.body,
      slug: req.body.title
        ? slugify(req.body.title, { lower: true })
        : blog.slug,
    };

    blog = await Blog.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE BLOG
 * Author (own blog) / Admin
 */
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * LIKE / UNLIKE BLOG
 * Reader
 */
const toggleLikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    const liked = blog.likes.includes(req.user.id);

    if (liked) {
      blog.likes.pull(req.user.id);
    } else {
      blog.likes.push(req.user.id);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      liked: !liked,
      totalLikes: blog.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET BLOGS BY AUTHOR
 * Dashboard
 */
const getBlogsByAuthor = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
  getBlogsByAuthor,
};
