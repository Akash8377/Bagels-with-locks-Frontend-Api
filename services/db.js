const mysql = require("mysql");
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bagels",
});

conn.connect();
module.exports = conn;
