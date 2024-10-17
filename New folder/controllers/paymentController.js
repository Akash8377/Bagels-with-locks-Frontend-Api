const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Make sure the Stripe key is set in your environment

// Controller to handle Stripe payment intent creation
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || !paymentMethodId) {
      return res.status(400).json({ error: "Amount and PaymentMethodId are required" });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true, // Automatically confirm the payment
    });

    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
