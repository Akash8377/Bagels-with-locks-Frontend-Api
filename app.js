const express = require("express");
const routes = require("./routes/routes");
const webRoutes = require("./routes/webRoutes");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const path = require("path");
const https = require("https");
const http = require("http");
const fs = require("fs");
require("dotenv").config();
const cors = require("cors");
const session = require("express-session");

const app = express();

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('./path/to/server.key'),
  cert: fs.readFileSync('./path/to/server.cert')
};

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
app.use(cors({
  origin: "*",
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
const hostname = process.env.HOST || "0.0.0.0";
const httpPort = process.env.PORT || 8800; // HTTP Port
const httpsPort = process.env.HTTPS_PORT || 8443; // HTTPS Port

// Create HTTP server (Optional: redirect HTTP to HTTPS)
http.createServer((req, res) => {
  res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(httpPort, hostname, () => {
  console.log(`HTTP server running on http://${hostname}:${httpPort}`);
});

// Create HTTPS server
https.createServer(httpsOptions, app).listen(httpsPort, hostname, () => {
  console.log(`HTTPS server running on https://${hostname}:${httpsPort}`);
});

module.exports = app;
