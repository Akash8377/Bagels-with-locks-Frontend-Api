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
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Add Stripe secret key

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
app.use(cors({
  origin: "*",  // Update this to your frontend domain for better security
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use(morgan("tiny"));

// Stripe payment route
app.post("/create-payment-intent", async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe works with the smallest currency unit
      currency: "usd", // Change this to match your preferred currency
      payment_method_types: ["card"], // Payment methods, can be expanded to more
    });

    // Send client secret to the frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

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
const hostname = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces
const port = process.env.PORT || 9000;

app.listen(port, hostname, () => {
  console.log(`Server running on https://${hostname}:${port}`);
});

module.exports = app;
