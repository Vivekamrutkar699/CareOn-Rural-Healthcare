const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
// Gemini AI Configuration
// -----------------------------

if (!process.env.GEMINI_API_KEY) {
    console.error(
        "GEMINI_API_KEY is not configured. Please check your .env file."
    );
}

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// -----------------------------
// Helper: Convert Image
// -----------------------------

function bufferToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}

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
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No image file uploaded.",
            });
        }

        if (!genAI) {
            return res.status(500).json({
                success: false,
                error: "AI service is not configured.",
            });
        }

        const analysisType = req.body.analysisType;

        let prompt;

        // -----------------------------
        // Skin Analysis
        // -----------------------------

        if (analysisType === "skin") {
            prompt = `
You are an AI health assistant supporting people in rural areas.

Analyze the uploaded image carefully.

Provide the response using these sections:

1. What We See
Describe only visible characteristics such as:
- color
- shape
- texture
- approximate size
- location
- visible swelling or irritation

2. Possible Conditions
List 2-3 possible common conditions that could sometimes look similar.
Do NOT claim that the image provides a definite diagnosis.

3. What To Do Next
Give safe general steps the person can take.
Do not prescribe medication or provide a definitive treatment plan.

4. When To Seek Medical Help
Mention warning signs that should require evaluation by a qualified healthcare professional.

End with:

IMPORTANT: This AI-generated information is for educational purposes only and is not a medical diagnosis. A qualified doctor or healthcare professional should evaluate the condition and provide medical advice.
`;
        }

        // -----------------------------
        // Medical Report Analysis
        // -----------------------------

        else if (analysisType === "report") {
            prompt = `
You are an AI health assistant.

Analyze the uploaded medical report carefully.

Provide the response using these sections:

1. Report Summary
Identify what type of report it appears to be and what it is generally used to evaluate.

2. Key Findings
List the important values, observations, or findings visible in the report.

3. Understanding Abnormal Values
For values that appear outside the reference range:
- identify the value
- mention the reference range if visible
- explain in simple language what the test generally measures
- explain that abnormal values can have multiple causes

Do not diagnose a disease based only on the report.

4. Questions For Your Doctor
Suggest useful questions the patient can ask a qualified healthcare professional.

End with:

IMPORTANT: This AI-generated explanation is for educational purposes only and is not a medical diagnosis. Do not start, stop, or change medication based only on this analysis. A qualified healthcare professional should interpret the report in the context of the patient's symptoms and medical history.
`;
        }

        else {
            return res.status(400).json({
                success: false,
                error: "Invalid analysis type.",
            });
        }

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
            });

            const imagePart = bufferToGenerativePart(
                req.file.buffer,
                req.file.mimetype
            );

            const result = await model.generateContent([
                prompt,
                imagePart,
            ]);

            const response = await result.response;
            const text = response.text();

            return res.json({
                success: true,
                analysis: text,
            });
        }

        catch (error) {
            console.error("Gemini API Error:", error);

            return res.status(500).json({
                success: false,
                error: "Unable to analyze the image right now. Please try again later.",
            });
        }
    }
);

// -----------------------------
// 404 / Temporary Test Endpoint
// -----------------------------

module.exports = router;