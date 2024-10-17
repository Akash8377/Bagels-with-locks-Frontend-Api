const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure you have this in your .env
const conn = require('../services/db')
const jwt = require('jsonwebtoken')

router.post('/charge', async (req, res) => {

  const { tierName, amount, paymentMethodId, returnUrl } = req.body; // Use paymentMethodId


  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const authToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(authToken, process.env.TOKEN_KEY);
    const userId = decoded.id;

    // Retrieve payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const customerName = paymentMethod.billing_details.name || 'Unknown User';
    const customerEmail = paymentMethod.billing_details.email || 'Unknown Email';
    const customerPhone = paymentMethod.billing_details.phone || 'Unknown Phone';

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      return_url: returnUrl,
    });

    // Store paymentMethodId in the payment_intent_id column instead of paymentIntent.id

    const sqlQuery = `INSERT INTO payments (user_id, name, email, phone, tierName, amount, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [userId, customerName, customerEmail, customerPhone, tierName, amount, paymentMethodId]; // Use paymentMethodId here



    conn.query(sqlQuery, values, (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error: " + err.message });
      }
      res.status(200).send({ success: true, paymentIntent });
    });
  } catch (error) {
    console.error('Payment failed:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;