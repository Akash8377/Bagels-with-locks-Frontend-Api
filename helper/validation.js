const { check } = require("express-validator");

exports.loginUpValidataion = [
  check("email", "Email is required").not().isEmpty(),
  check("password", "Password is required").not().isEmpty(),
];

// Validation middleware for sign-up data
exports.signUpValidation = [
  check("first_name", "Name is required").not().isEmpty(),
  check("last_name", "Last Name is required").not().isEmpty(),
  check("email", "Email is required").not().isEmpty().isEmail(),
  check("password", "Password is required").not().isEmpty(),
  check("confirm_password", "Confirm Password is required").not().isEmpty(),
  check(
    "confirm_password",
    "The password and confirm password fields do not match."
  ).custom((value, { req }) => {
    return value === req.body.password;
  }),
];

exports.forgetPasswordUpValidataion = [
  check("email", "Email is required").isEmail(),
];
exports.gridValidataion = [
  check("expected_value", "Expected Value is required").not().isEmpty(),
  check("win_percentage", "Win Percentage is required").not().isEmpty(),
  check("major_percentage", "Major Percentage is required").not().isEmpty(),
  check("team", "Team Name is required").not().isEmpty(),
  check("future", "Future is required").not().isEmpty(),
];
exports.topValidataion = [
  check("home_team", "Home Team is required").not().isEmpty(),
  check("away_team", "Away Team is required").not().isEmpty(),
];
exports.userEmailValidataion = [
  check("user_mail_name", "Email is required").not().isEmpty(),
];
exports.contactValidation = [
  check("first_name", "First Name is required").not().isEmpty(),
  check("last_name", "Last Name is required").not().isEmpty(),
  check("email", "Email is required").not().isEmpty(),
  check("phoneno", "Phone Number is required").not().isEmpty(),
  check("message", "Message is required").not().isEmpty(),
];
