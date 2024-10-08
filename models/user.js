const AppError = require("../utils/appError");
const conn = require("../services/db");

exports.getAllUser = (req, res, next) => {
 conn.query("SELECT * FROM users", function (err, data, fields) {
   if(err) return next(new AppError(err))
   res.status(200).json({
     status: "success",
     length: data?.length,
     data: data,
   });
 });
};


exports.createUser = (req, res, next) => {
 if (!req.body) return next(new AppError("No form data found", 404));
 const values = [req.body.name, "pending"];
 conn.query(
   "INSERT INTO users (name, status) VALUES(?)",
   [values],
   function (err, data, fields) {
     if (err) return next(new AppError(err, 500));
     res.status(201).json({
       status: "success",
       message: "User created!",
     });
   }
 );
};


exports.getUser = (req, res, next) => {
 if (!req.params.id) {
   return next(new AppError("No todo id found", 404));
 }
 conn.query(
   "SELECT * FROM todolist WHERE id = ?",
   [req.params.id],
   function (err, data, fields) {
     if (err) return next(new AppError(err, 500));
     res.status(200).json({
       status: "success",
       length: data?.length,
       data: data,
     });
   }
 );
};


exports.updateUser = (req, res, next) => {
 if (!req.params.id) {
   return next(new AppError("No todo id found", 404));
 }
 conn.query(
   "UPDATE todolist SET status='completed' WHERE id=?",
   [req.params.id],
   function (err, data, fields) {
     if (err) return next(new AppError(err, 500));
     res.status(201).json({
       status: "success",
       message: "todo updated!",
     });
   }
 );
};

exports.deleteUser = (req, res, next) => {
 if (!req.params.id) {
   return next(new AppError("No todo id found", 404));
 }
 conn.query(
   "DELETE FROM todolist WHERE id=?",
   [req.params.id],
   function (err, fields) {
     if (err) return next(new AppError(err, 500));
     res.status(201).json({
       status: "success",
       message: "todo deleted!",
     });
   }
 );
}