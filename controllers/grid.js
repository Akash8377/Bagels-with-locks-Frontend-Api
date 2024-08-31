const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");

exports.get = (req, res) => {
  let sqlQuery = `
    SELECT 
      g.id AS grid_id, 
      g.expected_value, 
      g.win_percentage, 
      g.major_percentage, 
      g.team, 
      g.future, 
      g.status AS grid_status, 
      wi.id AS week_info_id, 
      wi.spread, 
      wi.status AS week_info_status, 
      w.id AS week_id, 
      w.week_name AS week_originalname, 
      wi.week_name AS week_name,  -- This gets the ID from week_info
      o.id AS opponent_id, 
      o.opponent_name AS opponent_originalname, 
      wi.opponent_name AS opponent_name  -- This gets the ID from week_info
    FROM grid g
    LEFT JOIN week_info wi ON g.id = wi.grid_id
    LEFT JOIN week w ON wi.week_name = w.id  -- Join using the ID stored in week_info
    LEFT JOIN opponent o ON wi.opponent_name = o.id  -- Join using the ID stored in week_info
  `;

  conn.query(sqlQuery, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: err,
      });
    } else {
      // Group the results by grid
      const groupedResult = result.reduce((acc, row) => {
        if (!acc[row.grid_id]) {
          acc[row.grid_id] = {
            id: row.grid_id,
            expected_value: row.expected_value,
            win_percentage: row.win_percentage,
            major_percentage: row.major_percentage,
            team: row.team,
            future: row.future,
            status: row.grid_status,
            week_info: [],
          };
        }
        if (row.week_info_id) {
          acc[row.grid_id].week_info.push({
            id: row.week_info_id,
            week_id: row.week_id,
            week_name: row.week_name,  // ID from week_info
            week_originalname: row.week_originalname,  // Name from week table
            opponent_id: row.opponent_id,
            opponent_name: row.opponent_name,  // ID from week_info
            opponent_originalname: row.opponent_originalname,  // Name from opponent table
            spread: row.spread,
            status: row.week_info_status,
          });
        }
        return acc;
      }, {});

      const finalResult = Object.values(groupedResult);

      res.status(200).send({
        status: "success",
        length: finalResult.length,
        data: finalResult,
      });
    }
  });
};
