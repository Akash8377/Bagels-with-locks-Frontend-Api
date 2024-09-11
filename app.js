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
const session = require("express-session");

const app = express();

// Set up view engine and public folder
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

// CORS configuration - Update with specific origin as needed
app.use(cors({
  origin: "*",  // Allow all origins or specify your frontend domain for security (e.g., 'http://your-frontend-domain.com')
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use(morgan("tiny"));

// Routes
app.use("/", routes);
app.use("/", webRoutes);

// Handle undefined routes (404)
app.all("*", (req, res, next) => {
  next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

// Global error handling middleware
app.use(errorHandler);

// Server setup
const hostname = process.env.HOST || "0.0.0.0";  // Listen on all network interfaces
const port = process.env.PORT || 8800;

app.listen(port, hostname, () => {
  console.log(`Server running on https://${hostname}:${port}`);
});

module.exports = app;
