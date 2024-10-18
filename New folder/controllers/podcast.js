const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const slugify = require("slugify");
const conn = require("../services/db");

exports.get = (req, res) => {
  let sqlQuery = "SELECT * FROM  podcast";

  conn.query(sqlQuery, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: err,
      });
    } else {
      res.status(200).send({
        status: "success",
        length: result?.length,
        data: result,
      });
    }
  });
};