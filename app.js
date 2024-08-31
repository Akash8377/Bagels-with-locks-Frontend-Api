const express = require("express");
const routes = require("./routes/routes");
const webRoutes = require("./routes/webRoutes");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const path = require("path");
require("dotenv").config();
const cors = require("cors");
const session = require("express-session"); // Import the cors middleware
const app = express();
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static(path.resolve("./public")));
app.use(express.static(path.join(__dirname, "public")));
global.__basedir = __dirname;

// Use express-session middleware
app.use(
  session({
    secret: "yourSecretKeyHere",
    resave: false,
    saveUninitialized: true,
  })
);
// Use cors middleware
app.use(cors());
// Static Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use("/", routes);
app.use("/", webRoutes);
app.all("*", (req, res, next) => {
  next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

app.use(errorHandler);

const hostname = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 8800;

app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});

module.exports = app;
