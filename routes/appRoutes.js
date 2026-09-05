const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

const express = require("express");
const multer = require("multer");
const { analyzeHealthImage } = require("../services/geminiService");

const router = express.Router();

// -----------------------------
// File Upload Configuration
// -----------------------------

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

// -----------------------------
// Home
// -----------------------------

router.get("/", (req, res) => {
    res.render("home", {
        title: "CareOn - Rural Healthcare",
    });
});

// -----------------------------
// Dashboard
// -----------------------------
// Accessible by all authenticated users

router.get("/dashboard", requireAuth, (req, res) => {
    res.render("dashboard", {
        title: "CareOn Dashboard",
        user: req.user,
    });
});

// -----------------------------
// Patients
// -----------------------------
// Accessible only by Doctors and Admins

router.get(
    "/patients",
    requireAuth,
    requireRole("DOCTOR", "ADMIN"),
    (req, res) => {
        res.render("patients", {
            title: "Patient Management",
            user: req.user,
        });
    }
);

// -----------------------------
// Telemedicine
// -----------------------------
// Accessible by Patients and Doctors

router.get(
    "/telemedicine",
    requireAuth,
    requireRole("PATIENT", "DOCTOR"),
    (req, res) => {
        res.render("telemedicine", {
            title: "Telemedicine",
            user: req.user,
        });
    }
);

// -----------------------------
// AI Health Assistant
// -----------------------------
// Accessible by Patients and Doctors

router.get(
    "/ai-assistant",
    requireAuth,
    requireRole("PATIENT", "DOCTOR"),
    (req, res) => {
        res.render("ai-assistant", {
            title: "AI Health Assistant",
            user: req.user,
        });
    }
);

// -----------------------------
// Medicine & Community Health
// -----------------------------
// Accessible by all authenticated users

router.get(
    "/medicine",
    requireAuth,
    (req, res) => {
        res.render("medicine", {
            title: "Medicine & Community Health",
            user: req.user,
        });
    }
);

// -----------------------------
// AI Health Image Analysis
// -----------------------------
// Only Patients and Doctors can use AI analysis

router.post(
    "/analyze-health-image",
    requireAuth,
    requireRole("PATIENT", "DOCTOR"),
    upload.single("healthImage"),
    async (req, res) => {
        try {
            // -----------------------------
            // Validate uploaded file
            // -----------------------------

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "No image file uploaded.",
                });
            }

            // -----------------------------
            // Validate analysis type
            // -----------------------------

            const analysisType = req.body.analysisType;

            if (!["skin", "report"].includes(analysisType)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid analysis type.",
                });
            }

            // -----------------------------
            // Analyze image using Gemini
            // -----------------------------

            const analysis = await analyzeHealthImage(
                req.file.buffer,
                req.file.mimetype,
                analysisType
            );

            return res.json({
                success: true,
                analysis,
            });
        } catch (error) {
            console.error("Gemini API Error:", error);

            return res.status(500).json({
                success: false,
                error: "Unable to analyze the image right now. Please try again later.",
            });
        }
    }
);

module.exports = router;