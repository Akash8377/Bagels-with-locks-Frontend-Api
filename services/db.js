const mysql = require("mysql");
const conn = mysql.createConnection({
  host: "database-1.c54c86qsuhll.us-east-1.rds.amazonaws.com",
  port:"3306",
  user: "admin",
  password: "spreadsandlocks",
  database: "bagels",
});

conn.connect();
module.exports = conn;
