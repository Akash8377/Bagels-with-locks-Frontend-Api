const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const randomstring = require("randomstring");
const sendMail = require("../helper/sendMail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const fs = require("fs/promises");
const token_key = process.env.TOKEN_KEY;

// User Register

exports.register = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email;

  // Check if the email already exists
  conn.query(
    `SELECT * FROM users WHERE email = LOWER(${conn.escape(email)});`,
    (err, result) => {
      if (err) {
        return res.status(500).send({
          msg: "Database error during email check",
        });
      }

      if (result && result.length) {
        return res.status(409).send({
          msg: "This email already exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, async (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: "Error hashing password",
            });
          } else {
            // Proceed with user insertion and sending verification email
            const date_time = new Date();
            const user = {
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              phoneno:req.body.phoneno,
              promo_code:req.body.promo_code,
              email: email,
              password: hash,
              created_at: date_time,
              updated_at: date_time,
            };

            try {
              // Insert user into the database
              await conn.query("INSERT INTO users SET ?", user);

              // Generate verification token and link
              /* const randomToken = randomstring.generate();
              let mailSubjet = "Email Mail Verification";
              let verificationLink = `http://127.0.0.1:9900/user/mail-verification/${randomToken}`;
              const template = await fs.readFile(
                "views/sendveryfactionmail.ejs",
                "utf-8"
              );
              const content = ejs.render(template, {
                name: req.body.first_name, 
                verificationLink,
              });
              sendMail(req.body.email, mailSubjet, content);*/
              /*  await conn.query("UPDATE users SET token = ? WHERE email = ?", [
                randomToken,
                email,
              ]);*/

              return res.status(200).send({
                msg: "User has been registered successfully",
              });
            } catch (error) {
              return res.status(500).send({
                msg: "Error registering user",
              });
            }
          }
        });
      }
    }
  );
};
// User Login
exports.getUserLogin = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }
  //console.log(req.body.email);
  conn.query(
    `SELECT * FROM users WHERE email = ${conn.escape(req.body.email)}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }

      if (!result.length) {
        return res.status(400).send({
          msg: "Email or Password is incorrect!",
        });
      }
      const user = result[0];

      if (user.status === 0) {
        // User account is blocked
        return res.status(400).send({
          msg: "Account is blocked. Please contact the administrator.",
        });
      }

      bcrypt.compare(req.body.password, user.password, (bErr, bresult) => {
        if (bErr) {
          return res.status(400).send({
            msg: bErr,
          });
        }
        if (bresult) {
          const token = jwt.sign(
            { id: user.id, is_admin: user.is_admin },
            token_key,
            { expiresIn: "10h" }
          );
          conn.query(
            `UPDATE users SET last_login = NOW() WHERE id = ${user.id}`
          );
          res.status(200).send({
            status: "success",
            token,
            length: result?.length,
            data: result,
          });
        } else {
          return res.status(400).send({
            msg: "Email or Password is incorrect!",
          });
        }
      });
    }
  );
};

// User Email verifaction ==

exports.verifymail = (req, res) => {
  var token = req.params.token; // Access the token parameter correctly

  conn.query(
    "SELECT * FROM users WHERE token = ? LIMIT 1",
    [token],
    function (error, result, field) {
      if (error) {
        console.log(error.message);
        return res.render("404"); // Render 404 page on error
      }
      console.log(token);
      if (result.length > 0) {
        conn.query(
          `UPDATE users SET token = null, is_verified = 1 WHERE id = '${result[0].id}'`,
          function (updateError, updateResult) {
            if (updateError) {
              console.log(updateError.message);
              return res.render("404"); // Render 404 page on error
            }
            return res.render("mailveryfction");
          }
        );
      } else {
        return res.render("404");
      }
    }
  );
};

// Get login User Profile

exports.welcome = (req, res) => {
  try {
    const authToken = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(authToken, token_key);

    conn.query(
      `SELECT * FROM users WHERE id = ?`,
      decode.id,
      function (error, result, fields) {
        if (error) {
          throw error; // Throw the error to trigger the catch block
        }
        if (result && result.length > 0) {
          return res.status(200).send({
            success: true,
            data: result[0],
            msg: "Fetch Successful!",
          });
        } else {
          return res.status(404).send({
            success: false,
            msg: "User not found!",
          });
        }
      }
    );
  } catch (err) {
    // Catching and handling errors
    return res.status(500).send({
      success: false,
      msg: "Error fetching user data",
      error: err.message, // Provide the error message to identify the issue
    });
  }
};

// Logout Function

exports.logout = (req, res) => {
  const tokenBlacklist = new Set();
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(400).send({ message: "Token is required for logout" });
  }

  // Add the token to the list of revoked tokens

  tokenBlacklist.add(token);

  res.status(200).send({ message: "Logged out successfully" });
};

// Froget Password
exports.forget_password = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }
  conn.query(
    `SELECT * FROM users where email =? limit 1`,
    req.body.email,
    async function (error, result, field) {
      if (error) {
        return res.status(400).json({ message: error });
      }
      if (result.length > 0) {
        let mailSubjet = "Reset Your Password";
        const randomToken = randomstring.generate();
        let verificationLink = `http://127.0.0.1:9900/reset-password?token=${randomToken}`;
        const template = await fs.readFile(
          "views/send-reset-password-mail.ejs",
          "utf-8"
        );
        const content = ejs.render(template, {
          name: req.body.first_name, // Assuming req.body.name contains the user's name
          verificationLink,
        });
        sendMail(req.body.email, mailSubjet, content);
        var date_time = new Date();
        const sqlQuery = `INSERT INTO password_reset (email, token, created_at) VALUES (?, ?, ?)`;
        const values = [result[0].email, randomToken, date_time];
        conn.query(sqlQuery, values, (err, result) => {
          if (err) {
            return res.status(500).send({
              msg: err,
            });
          } else {
            conn.query(
              "UPDATE users SET password_reset_token = ? WHERE email = ?",
              [randomToken, req.body.email],
              (err, result) => {
                if (err) {
                  return res.status(500).send({
                    msg: err,
                  });
                } else {
                  res.status(200).send({
                    status: "success",
                    msg: "Reset Password link send your email id",
                  });
                }
              }
            );
          }
        });
      } else {
        return res.status(400).send({
          msg: "Email incorrect!",
        });
      }
    }
  );
};

exports.reset_password = (req, res) => {
  try {
    const token = req.query.token; // Changed from req.params.token to req.query.token
    let sqlQuery = "SELECT * FROM password_reset where token = ?";

    conn.query(sqlQuery, [token], (err, result) => {
      if (err) {
        return res.status(500).send({
          msg: err,
        });
      }
      if (result !== undefined && result.length > 0) {
        const email = result[0].email;
        let sqlQuery = "SELECT * FROM users where email = ?";
        conn.query(sqlQuery, [email], (err, result) => {
          if (err) {
            console.log(err.message);
          }
          res.render("reset-password", { user: result[0] });
        });
      } else {
        res.render("404");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.reset_password_update = (req, res) => {
  if (req.body.password != req.body.confirmPassword) {
    res.render("reset-password", {
      error_message: "Confirm Password not Matching",
      user: { id: req.body.user_id, email: req.body.email },
    });
  }
  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) {
      console.log(err);
    } else {
      conn.query(`DELETE FROM password_reset where email= '${req.body.email}'`);
      conn.query(
        `UPDATE users SET  password ='${hash}' where id= '${req.body.user_id}'`
      );
      return res.render("update-password-message");
    }
  });
};

exports.update_profile = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const authToken = req.headers.authorization.split(" ")[1];
  const decode = jwt.verify(authToken, token_key);
  user_id = decode.id;
  var date_time = new Date();
  const sqlQuery = `UPDATE users SET first_name = ?,last_name = ?,country = ?,state = ?,city = ?,zip = ?,address = ?,email = ?,phoneno = ?,updated_at=? WHERE id = ?;`;
  const values = [
    req.body.first_name,
    req.body.last_name,
    req.body.country,
    req.body.state,
    req.body.city,
    req.body.zip,
    req.body.address,
    req.body.email,
    req.body.phoneno,
    date_time,
    user_id,
  ];
  conn.query(sqlQuery, values, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: err,
      });
    } else {
      res.status(200).send({
        status: "success",
        msg: "Profile update successful",
      });
    }
  });
};
exports.update_password = (req, res) => {
  // Ensure required fields exist in the request
  if (
    !req.headers.authorization ||
    !req.body.old_password ||
    !req.body.new_password
  ) {
    return res.status(400).send({
      status: "error",
      msg: "Missing fields in the request",
    });
  }

  const authToken = req.headers.authorization.split(" ")[1];
  let decodedUserId;
  try {
    const decode = jwt.verify(authToken, token_key);
    decodedUserId = decode.id; // User's ID
  } catch (jwtError) {
    return res.status(401).send({
      status: "error",
      msg: "Invalid authorization token",
    });
  }

  const userId = decodedUserId;
  const oldPassword = req.body.old_password;
  const newPassword = req.body.new_password;

  conn.query("SELECT * FROM users WHERE id = ?", [userId], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).send({
        status: "error",
        msg: "Database error",
      });
    }

    if (results.length === 0) {
      console.log("User not found");
      return res.status(404).send({
        status: "error",
        msg: "User not found",
      });
    }

    const user = results[0];
    const hashedPassword = user.password; // Assuming password is stored in a field named 'password'

    // Compare old password with hashed password from the database
    bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error("Bcrypt error:", err);
        return res.status(500).send({
          status: "error",
          msg: "Bcrypt error",
        });
      }

      if (isMatch) {
        // Old password matches, proceed to update password
        bcrypt.hash(newPassword, 10, (hashErr, hashedNewPassword) => {
          if (hashErr) {
            console.error("Bcrypt hashing error:", hashErr);
            return res.status(500).send({
              status: "error",
              msg: "Bcrypt hashing error",
            });
          }

          // Update the user's password in the database
          conn.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedNewPassword, userId],
            (updateError, updateResults) => {
              if (updateError) {
                console.error("Database update error:", updateError);
                return res.status(500).send({
                  status: "error",
                  msg: "Database update error",
                });
              }
              res.status(200).send({
                status: "success",
                msg: "Password updated successfully",
              });
            }
          );
        });
      } else {
        res.status(400).send({
          status: "error",
          msg: "Old password does not match",
        });
      }
    });
  });
};

exports.checkuser = (req, res) => {
  // Extract email from request body
  const email = req.body.email;

  // Check if the authorization header exists
  if (req.headers.authorization) {
    // Extract user ID from the JWT token
    try {
      const authToken = req.headers.authorization.split(" ")[1];
      const decode = jwt.verify(authToken, token_key);
      const user_id = decode.id;

      // Check if the email provided matches the user's email from the token
      conn.query(
        "SELECT email FROM users WHERE id = ?",
        [user_id],
        (error, results) => {
          if (error) {
            return res.status(500).send({
              msg: error,
            });
          }

          const user_email = results[0].email;

          if (user_email === email) {
            // Provided email matches the user's email from the token
            return res.status(200).send({
              status: "User login.",
            });
          } else {
            // Provided email doesn't match, check if the email exists in the database
            conn.query(
              "SELECT COUNT(*) AS count FROM users WHERE email = ?",
              [email],
              (error, results) => {
                if (error) {
                  return res.status(500).send({
                    msg: error,
                  });
                }

                const emailExists = results[0].count > 0;

                if (emailExists) {
                  // Email exists in the database
                  return res.status(200).send({
                    status: "Email exists but doesn't match user's email.",
                  });
                } else {
                  // Email doesn't exist in the database
                  return res.status(200).send({
                    status: "Email Not Found",
                  });
                }
              }
            );
          }
        }
      );
    } catch (error) {
      // Handle JWT verification error
      return res.status(401).send({
        msg: "Invalid or expired token",
      });
    }
  } else {
    // No authorization header
    // Proceed without authentication
    conn.query(
      "SELECT COUNT(*) AS count FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (error) {
          return res.status(500).send({
            msg: error,
          });
        }

        const emailExists = results[0].count > 0;

        if (emailExists) {
          // Email exists in the database
          return res.status(200).send({
            status: "Email already exists. Please log in.",
          });
        } else {
          // Email doesn't exist in the database
          return res.status(200).send({
            status: "Email Not Found",
          });
        }
      }
    );
  }
};
