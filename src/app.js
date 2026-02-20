const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
require("./models/category.models");

dotenv.config();

const { authroutes, blogroutes } = require("./router");

const app = express();

// ✅ CORS config that allows all origins (for development only)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser clients like curl
    return callback(null, true); // Allow all origins
  },
  credentials: true, // ✅ Allow cookies
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is reachable" });
});
app.use("/api/auth", authroutes);
app.use("/api/blogs", blogroutes);

module.exports = app;
