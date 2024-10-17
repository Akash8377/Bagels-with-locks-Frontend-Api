const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");

exports.post = (req, res) => {
    // Validate request bodys
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { promocode, totalAmount } = req.body;

    // Check if promocode exists in your database
    const sqlQuery = `SELECT * FROM promocodes WHERE code = ?`;
    conn.query(sqlQuery, [promocode], (err, result) => {
        if (err) {
            return res.status(500).send({ msg: err });
        }

        if (result.length === 0) {
            return res.status(404).send({ msg: "Promo code not found" });
        }

        const discountPercentage = result[0].discount; 
        const discountAmount = (discountPercentage / 100) * totalAmount; 
        const finalAmount = totalAmount - discountAmount; 

        res.status(200).send({
            status: "success",
            originalAmount: totalAmount,
            discount: discountAmount,
            discountedPrice: finalAmount,
        });
    });
};