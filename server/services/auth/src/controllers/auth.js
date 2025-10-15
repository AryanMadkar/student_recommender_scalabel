const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { validationResult } = require("express-validator");
const emailService = require("../services/email.service")

const register = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { name, email, password, phone, educationStage } = req.body;
        const existingUser = await User.findOne({ "personalInfo.email": email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            personalInfo: { name, email, phone },
            password: hashedPassword,
            educationStage,
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        try {
            await emailService.sendWelcomeEmail(
                user.personalInfo.email,
                user.personalInfo.name
            )
        } catch (emailError) {
            console.warn("Failed to send welcome email:", emailError.message);
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                token, // Still send in response for flexibility
                user: {
                    id: user._id,
                    name: user.personalInfo.name,
                    email: user.personalInfo.email,
                    educationStage: user.educationStage,
                },
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ "personalInfo.email": email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "Account setup incomplete. Please contact support.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "3d",
        });

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        user.progress.lastActive = new Date();
        await user.save();

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.personalInfo.name,
                    email: user.personalInfo.email,
                    educationStage: user.educationStage,
                    profileCompletion: user.progress.profileCompletion,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
}

const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
}

const validateToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.personalInfo.name,
                    email: user.personalInfo.email,
                    educationStage: user.educationStage,
                    profileCompletion: user.progress?.profileCompletion || 0,
                }
            }
        });
    } catch (error) {
        console.error("Token validation error:", error);
        res.status(500).json({
            success: false,
            message: "Token validation failed"
        });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ "personalInfo.email": email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            });
        }

        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET + user.password,
            { expiresIn: "1h" }
        );

        try {
            await emailService.sendPasswordResetEmail(email, resetToken);
            res.json({
                success: true,
                message: "Password reset email sent successfully",
            });
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            res.status(500).json({
                success: false,
                message: "Failed to send password reset email",
            });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
const getCurrentUser = async (req, res) => {
    try {
        console.log('📋 Get Current User - User ID:', req.user?.id);

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    validateToken,
    forgotPassword,
    resetPassword,
    getCurrentUser
}
