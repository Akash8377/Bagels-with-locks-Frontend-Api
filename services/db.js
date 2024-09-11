const mysql = require("mysql");
const conn = mysql.createConnection({
  host: "database-1.c54c86qsuhll.us-east-1.rds.amazonaws.com",
  port: 3306, 
  user: "admin",
  password: "spreadsandlocks",
  database: "bagels",
});

conn.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
    return;
  }
  console.log("Connected to database.");
});

module.exports = conn;


conn.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
    return;
  }
  console.log("Connected to database.");
});

module.exports = conn;
