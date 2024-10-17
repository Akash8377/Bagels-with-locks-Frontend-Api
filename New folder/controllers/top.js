const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");

exports.get = (req, res) => {
  // Updated SQL query with JOIN
  let sqlQuery = `
    SELECT top.id, top.week_id, top.home_team, top.away_team, top.away_image, top.home_image, top.winning_team,winning_value, top.status, top.created_at, top.updated_at, week.week_name
    FROM top
    LEFT JOIN week ON top.week_id = week.id
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
