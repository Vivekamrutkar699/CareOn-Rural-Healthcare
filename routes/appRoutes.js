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

router.get("/dashboard", (req, res) => {
    res.render("dashboard", {
        title: "CareOn Dashboard",
    });
});

// -----------------------------
// Patients
// -----------------------------

router.get("/patients", (req, res) => {
    res.render("patients", {
        title: "Patient Management",
    });
});

// -----------------------------
// Telemedicine
// -----------------------------

router.get("/telemedicine", (req, res) => {
    res.render("telemedicine", {
        title: "Telemedicine",
    });
});

// -----------------------------
// AI Health Assistant
// -----------------------------

router.get("/ai-assistant", (req, res) => {
    res.render("ai-assistant", {
        title: "AI Health Assistant",
    });
});

// -----------------------------
// Medicine Management
// -----------------------------

router.get("/medicine", (req, res) => {
    res.render("medicine", {
        title: "Medicine Management",
    });
});

// -----------------------------
// AI Health Image Analysis
// -----------------------------

router.post(
    "/analyze-health-image",
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