const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/user");
const fileController = require("../controllers/file.controller");
const regestationController = require("../controllers/regestation");
const gridController = require("../controllers/grid");
const topController= require("../controllers/top");
const pickController = require("../controllers/wadepick");
const liveController = require("../controllers/adamlive");
const futureController = require("../controllers/adamfuture");
const slipController = require("../controllers/adamslip");
const articleController = require("../controllers/article");
const betController = require("../controllers/waderecord");
const userEmail= require("../controllers/useremail");
const totalWinController= require("../controllers/totalWin");
const recapController = require("../controllers/adamrecap");
const membership = require("../controllers/membership")
const contactUs = require("../controllers/contactus");
const promocode = require("../controllers/promocode");
const podcastController = require("../controllers/podcast");
const { createPaymentIntent } = require("../controllers/paymentController");

const {
  loginUpValidataion,
  signUpValidation,
  forgetPasswordUpValidataion,
  userEmailValidataion,
  contactValidation,
  topValidataion
} = require("../helper/validation");

// User Auth route
router.post("/charge", createPaymentIntent);
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

//check user membership
router.get("/membership", membership.get);

//check for promocode
router.post("/promocode", promocode.post);
// Ensure userController.logout is defined
router.post("/logout", userController.logout);

/* files upload/download Route */
router.post("/upload", fileController.upload);
router.get("/files", fileController.getListFiles);
router.get("/files/:name", fileController.download);
router.delete("/files/:name", fileController.remove);

router.get("/list-grid", gridController.get);
router.get("/list-top", topController.get);
router.get("/list-pick", pickController.get);

router.get("/list-live", liveController.get);
router.get("/list-podcast", podcastController.get);
router.get("/list-future", futureController.get);
router.get("/list-slip", slipController.get);
router.get("/list-article", articleController.get);
router.get("/list-bet", betController.get);
router.get("/list-win", totalWinController.get);
router.get("/list-recap", recapController.get);
router.post(
  "/add-user-email",
  userEmailValidataion,
  userEmail.register
);

//contact us-----------

router.post(
  "/add-contact",
  contactValidation,
  contactUs.register
);
router.get("/list-contact", auth.verifyToken, contactUs.get);
router.get("/edit-contact/:id",  contactUs.edit);

router.delete("/delete-contact/:id",  contactUs.delete);
router.put("/status-contact/:id",  contactUs.status);

module.exports = router; 