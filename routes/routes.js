const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/user");
const fileController = require("../controllers/file.controller");
const regestationController = require("../controllers/regestation");
const gridController = require("../controllers/grid");
const {
  loginUpValidataion,
  signUpValidation,
  forgetPasswordUpValidataion,
  gridValidataion,
} = require("../helper/validation");

// User Auth route
router.post("/register", signUpValidation, userController.register);
router.post("/login", loginUpValidataion, userController.getUserLogin);
router.get("/welcome", auth.verifyToken, userController.welcome);
router.post("/profile/update", auth.verifyToken, userController.update_profile);
router.post(
  "/profile/change-password",
  auth.verifyToken,
  userController.update_password
);
router.post("/check/user-email", userController.checkuser);
router.post(
  "/forget-password",
  forgetPasswordUpValidataion,
  userController.forget_password
);
router.get("/reset-password", userController.reset_password);
router.post("/reset-password", userController.reset_password_update);

// Ensure userController.logout is defined
router.post("/logout", userController.logout);

/* files upload/download Route */
router.post("/upload", fileController.upload);
router.get("/files", fileController.getListFiles);
router.get("/files/:name", fileController.download);
router.delete("/files/:name", fileController.remove);

router.get("/list-grid", auth.verifyToken, gridController.get);

module.exports = router; // export to use in server.js
