const User = require('../models/user'); // Adjust the path as necessary
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError'); // Adjust the path accordingly

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/data/uploads/')); // Path to store uploaded files
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({ storage: storage });

// Middleware for handling file upload
exports.uploadUserImage = upload.single('file');

// Update user image function
exports.updateUserImage = async (req, res, next) => {
    if (!req.params.id) {
        return next(new AppError("No user ID found", 404));
    }

    const userId = req.params.id; // Get user ID from params

    // SQL query to find the user by ID
    conn.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return next(new AppError(err.message || 'Server error', 500));
        }
        if (results.length === 0) {
            return next(new AppError("User not found", 404));
        }

        // Assuming you're getting the user object from results
        const user = results[0];

        // Check if a new file is uploaded
        if (req.file) {
            user.user_image = req.file.path; // Update user image path
        }

        // SQL query to update the user image
        conn.query("UPDATE users SET user_image = ? WHERE id = ?", [user.user_image, userId], (err) => {
            if (err) {
                console.error('Error updating user image:', err);
                return next(new AppError(err.message || 'Server error', 500));
            }

            res.status(200).json({
                status: "success",
                message: "User image updated successfully!",
                data: user // Return the updated user data
            });
        });
    });
};

