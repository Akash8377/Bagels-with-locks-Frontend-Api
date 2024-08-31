const AppError = require("../utils/appError");
const conn = require("../services/db");

getAllCountry = (req, res, next) => {
 conn.query("SELECT * FROM `countries` ORDER BY `en_short_name` ASC", function (err, data, fields) {
   if(err) return next(new AppError(err))
   res.status(200).json({
     status: "success",
     length: data?.length,
     data: data,
   });
 });
};

module.exports = {getAllCountry};