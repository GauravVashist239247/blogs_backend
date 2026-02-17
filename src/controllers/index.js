const { getProfile } = require("./auth.Controller.js");
const { changeUserRole } = require("./auth.Controller.js");
const { loginUser } = require("./auth.Controller.js");
const { registerUser } = require("./auth.Controller.js");

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changeUserRole,
};
