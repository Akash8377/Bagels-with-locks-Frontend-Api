const AppError = require("../utils/appError");
const conn = require("../services/db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.verifyToken = (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer") ||
      !req.headers.authorization.split(" ")[1]
    ) {
      return res.status(400).send({
        msg: "Plasse provide token",
      });
    }
    next();
  } catch (error) {
    return res.status(400).send({
      msg: error,
    });
  }
};
