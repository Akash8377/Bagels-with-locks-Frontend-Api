const AppError = require("../utils/appError");
const conn = require("../services/db");

// Get all users
exports.getAllUsers = (req, res, next) => {
  conn.query("SELECT * FROM users", function (err, data) {
    if (err) return next(new AppError(err.message, 500));
    res.status(200).json({
      status: "success",
      length: data.length,
      data: data,
    });
  });
};

// Create a user
exports.createUser = (req, res, next) => {
  if (!req.body || !req.body.name) {
    return next(new AppError("No form data found", 400));
  }
  const values = [req.body.name, "pending"];
  conn.query(
    "INSERT INTO users (name, status) VALUES (?, ?)", // Changed to use placeholder for each value
    values,
    function (err, result) {
      if (err) return next(new AppError(err.message, 500));
      res.status(201).json({
        status: "success",
        message: "User created!",
        userId: result.insertId // Optionally return the created user ID
      });
    }
  );
};

// Get a specific user
exports.getUser = (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("No user id found", 404));
  }
  conn.query(
    "SELECT * FROM users WHERE id = ?",
    [req.params.id],
    function (err, data) {
      if (err) return next(new AppError(err.message, 500));
      if (data.length === 0) {
        return next(new AppError("User not found", 404));
      }
      res.status(200).json({
        status: "success",
        data: data[0], // Return the user object
      });
    }
  );
};

// Update a user
exports.updateUser = (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("No user id found", 404));
  }
  const values = [req.body.name, req.params.id]; // Assuming you want to update the name
  conn.query(
    "UPDATE users SET name = ? WHERE id = ?",
    values,
    function (err, result) {
      if (err) return next(new AppError(err.message, 500));
      if (result.affectedRows === 0) {
        return next(new AppError("User not found", 404));
      }
      res.status(200).json({
        status: "success",
        message: "User updated!",
      });
    }
  );
};

// Delete a user
exports.deleteUser = (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("No user id found", 404));
  }
  conn.query(
    "DELETE FROM users WHERE id = ?",
    [req.params.id],
    function (err, result) {
      if (err) return next(new AppError(err.message, 500));
      if (result.affectedRows === 0) {
        return next(new AppError("User not found", 404));
      }
      res.status(200).json({
        status: "success",
        message: "User deleted!",
      });
    }
  );
};
