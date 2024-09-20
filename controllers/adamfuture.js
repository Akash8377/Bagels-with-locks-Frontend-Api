const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");

exports.get = (req, res) => {
  // SQL query to join adam_future and game table based on game_id
  let sqlQuery = `
    SELECT adam_future.*, game.game_name 
    FROM adam_future 
    JOIN game ON adam_future.game_id = game.id
  `;

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
