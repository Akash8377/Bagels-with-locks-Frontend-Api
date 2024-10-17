const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");


exports.register = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  conn.query(
    `SELECT * FROM user_mail WHERE user_mail_name = LOWER(${conn.escape(
      req.body.user_mail_name
    )});`,
    (err, result) => {
      if (err) {
        return res.status(500).send({
          msg: err,
        });
      }

      if (result && result.length) {
        return res.status(409).send({
          msg: "This Week already exists",
        });
      } else {
        var date_time = new Date();
        const sqlQuery = `INSERT INTO user_mail (user_mail_name, created_at, updated_at) VALUES (?, ?, ?)`;
        const values = [
          req.body.user_mail_name,
          date_time,
          date_time,
        ];
        conn.query(sqlQuery, values, (err, result) => {
          if (err) {
            return res.status(500).send({
              msg: err,
            });
          } else {
            res.status(200).send({
              status: "success",
              msg: "Week registered successfully",
            });
          }
        });
      }
    }
  );
};
