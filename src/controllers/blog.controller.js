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
      image: req.file ? req.file.path : null,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category;

    let matchStage = { status: "published" };

    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }

    if (category) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    const blogs = await Blog.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          title: 1,
          slug: 1,
          content: 1,
          views: 1,
          image: 1,
          likesCount: 1,
          createdAt: 1,
          "author.name": 1,
          "category.name": 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      page,
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
    const blog = await Blog.aggregate([
      { $match: { slug: req.params.slug } },

      {
        $lookup: {
          from: "users",
          let: { authorId: "$author" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$authorId"] } } },
            { $project: { password: 0 } }, // ✅ remove password
          ],
          as: "author",
        },
      },
      { $unwind: "$author" },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
    ]);

    if (!blog.length) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    await Blog.updateOne({ slug: req.params.slug }, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      blog: blog[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE BLOG
 * Author (own blog) / Admin
 */

const getAllBlogsById = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    return res
      .status(201)
      .json({ success: true, message: "Blog found", data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    const authorId = new mongoose.Types.ObjectId(req.user.id);

    const blogs = await Blog.aggregate([
      { $match: { author: authorId } },

      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

    const stats = await Blog.aggregate([
      { $match: { author: authorId } },
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
      },
      blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBlogStats = async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      {
        $group: {
          _id: "$status",
          totalBlogs: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const searchBlogs = async (req, res) => {
  try {
    const {
      keyword = "",
      category,
      tag,
      sort = "latest",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let matchStage = {
      status: "published",
    };
    console.log("search keyword", keyword);
    // 🔍 Keyword search
    if (keyword) {
      matchStage.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    // 📂 Category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    // 🏷 Tag filter
    if (tag) {
      matchStage.tags = { $in: [tag] };
    }

    let sortStage = { createdAt: -1 };

    if (sort === "views") sortStage = { views: -1 };
    if (sort === "likes") sortStage = { likesCount: -1 };

    const blogs = await Blog.aggregate([
      { $match: matchStage },

      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      { $sort: sortStage },
      { $skip: skip },
      { $limit: limitNumber },

      {
        $project: {
          title: 1,
          slug: 1,
          views: 1,
          image: 1,
          likesCount: 1,
          createdAt: 1,
          "author.name": 1,
          "category.name": 1,
        },
      },
    ]);

    const totalResult = await Blog.aggregate([
      { $match: matchStage },
      { $count: "total" },
    ]);

    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      blogs,
    });
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
  getBlogStats,
  getAllBlogsById,
  searchBlogs,
};
