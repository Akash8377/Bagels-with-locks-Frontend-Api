const express = require("express");
const routes = require("./routes/routes");
const webRoutes = require("./routes/webRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // Add Stripe payment route
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

// CORS configuration
app.use(
  cors({
    origin: "*", // Set this to your frontend domain
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use(morgan("tiny"));

// Routes
app.use("/", routes);
app.use("/", webRoutes);
app.use("/api", paymentRoutes); // Add Stripe API route here

// Handle undefined routes (404)
app.all("*", (req, res, next) => {
  next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

// Global error handling middleware
app.use(errorHandler);

// Server setup
const hostname = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces
const port = process.env.PORT || 9000;

app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});

module.exports = app;
