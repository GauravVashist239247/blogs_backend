const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const {
  registerUser,
  loginUser,
  getProfile,
  changeUserRole,
} = require("../controllers");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getProfile);

router.put("/change-role", protect, authorizeRoles("admin"), changeUserRole);

module.exports = router;
