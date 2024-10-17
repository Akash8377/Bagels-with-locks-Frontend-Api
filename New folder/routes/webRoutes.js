const express = require("express");
const user_route = express();
user_route.set("view engine", "ejs");
user_route.set("views", "./views");
user_route.use(express.static("public"));
const userController = require("../controllers/user");

user_route.get("/user/mail-verification/:token", userController.verifymail);
/*user_route.get("/user/reset-password/:token", userController.reset_password);
user_route.post(
  "/user/reset-password-update",
  userController.reset_password_update
);*/

module.exports = user_route;
