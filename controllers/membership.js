// const AppError = require("../utils/appError");
// const { validationResult } = require("express-validator");
// require("dotenv").config();
// const conn = require("../services/db");

// exports.get = (req, res) => {

//     const {user_id} = req.query;

//   //let sqlQuery = "SELECT user_id, name, amount, tierName FROM payments ";

//   if(!user_id){
//     return res.status(400).send({
//       status:"fail",
//       message:"user_id is required",
//     });
//   }

//   let sqlQuery = `SELECT * FROM payments WHERE user_id`
// //   SELECT * FROM memberships WHERE user_id = ?;

//   conn.query(sqlQuery, [user_id], (err, result) => {
//     if (err) {
//       return res.status(500).send({
//         msg: err,
//       });
//     } else {
//       res.status(200).send({
//         status: "success",
//         length: result?.length,
//         data: result,
//       });
//     }
//   });
// };

const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");

exports.get = (req, res) => {
  const { user_id } = req.params; // Get user_id from req.params

  if (!user_id) {
    return res.status(400).send({
      status: "fail",
      message: "user_id is required", // Fixed typo from "user_is" to "user_id"
    });
  }

  let sqlQuery = `SELECT * FROM payments WHERE user_id = ?`;

  conn.query(sqlQuery, [user_id], (err, result) => {
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
