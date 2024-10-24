const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure you have this in your .env
const conn = require('../services/db')
const jwt = require('jsonwebtoken')

// router.post('/charge', async (req, res) => {
//   const { amount, paymentMethodId, firstName, email, phone, returnUrl } = req.body; // Use paymentMethodId

//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ error: "Authorization header missing" });
//     }

//     const authToken = authHeader.split(" ")[1];
//     const decoded = jwt.verify(authToken, process.env.TOKEN_KEY);
//     const userId = decoded.id;

//     // Retrieve payment method details
//     const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
//     const customerName = paymentMethod.billing_details.name || 'Unknown User';
//     const customerEmail = paymentMethod.billing_details.email || 'Unknown Email';
//     const customerPhone = paymentMethod.billing_details.phone || 'Unknown Phone';

//     // Create payment intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount),
//       currency: 'usd',
//       payment_method: paymentMethodId,
//       confirm: true,
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: 'never',
//       },
//       return_url: returnUrl,
//     });

//     // Store paymentMethodId in the payment_intent_id column instead of paymentIntent.id
//     const sqlQuery = `INSERT INTO payments (user_id, name, email, phone, amount, payment_intent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
//     const values = [userId, customerName, customerEmail, customerPhone, amount, paymentMethodId]; // Use paymentMethodId here

//     conn.query(sqlQuery, values, (err) => {
//       if (err) {
//         console.error("Database error:", err);
//         return res.status(500).json({ error: "Database error: " + err.message });
//       }
//       res.status(200).send({
//         success: true, 
//         paymentIntent,
//         created_at: paymentIntent.created
//        });
//     });
//   } catch (error) {
//     console.error('Payment failed:', error);
//     res.status(500).send({ error: error.message });
//   }
// });

// module.exports = router;

router.post('/charge', async (req, res) => {
  const { amount, paymentMethodId, firstName, email, phone, returnUrl } = req.body;

  try {
    // Check for the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    // Verify the JWT token
    const authToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(authToken, process.env.TOKEN_KEY);
    const userId = decoded.id;

    // Retrieve payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const customerName = paymentMethod.billing_details.name || 'Unknown User';
    const customerEmail = paymentMethod.billing_details.email || 'Unknown Email';
    const customerPhone = paymentMethod.billing_details.phone || 'Unknown Phone';

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Set to 'never' to handle payments without redirects
      },
      return_url: returnUrl, // Ensure return_url is passed
    });

    // Store payment information in the database
    const sqlQuery = `INSERT INTO payments (user_id, name, email, phone, amount, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [userId, customerName, customerEmail, customerPhone, amount, paymentIntent.id];

    conn.query(sqlQuery, values, (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error: " + err.message });
      }
      
      // Return success response with payment intent details
      res.status(200).send({ success: true, paymentIntent });
    });
  } catch (error) {
    console.error('Payment failed:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;