const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Setup multer for memory storage to handle file buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize the GoogleGenerativeAI with API key from .env
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment variables. Please check your .env file and ensure it's loaded correctly at the start of your application.");
    process.exit(1); // Exit the process with an error code
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to convert buffer to base64
function bufferToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType
        },
    };
}

// Route for the home page
router.get('/', (req, res) => {
    res.render('home', { title: 'CareOn - Home' });
});

// Route to render the doubt solver page
router.get('/doubt', (req, res) => {
    res.render('doubt', { title: 'Snap & Solve Doubt Tutor', solution: null, error: null });
});

// Route to handle the image upload and process with Gemini
router.post('/solve-doubt', upload.single('doubtImage'), async (req, res) => {
    if (!req.file) {
        return res.render('doubt', { title: 'Snap & Solve', solution: null, error: 'Please upload an image of the problem.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const prompt = `
            You are an expert AI tutor for competitive exams like JEE and NEET. A student has uploaded an image of a problem they are stuck on. Your task is to provide a comprehensive solution.

            1.  **Analyze the Problem:** Carefully read the text, interpret any diagrams, and identify the core concepts being tested.
            2.  **Step-by-Step Solution:** Provide a clear, detailed, step-by-step solution. Explain the logic and the formulas used at each step.
            3.  **Common Pitfalls:** After the solution, add a section called "Common Pitfalls" and mention 1-2 common mistakes students make when solving this type of problem.
            4.  **Practice Problems:** After the pitfalls, add a section called "Practice Problems" and generate 2 similar problems (without solutions) to help the student practice the concept.

            Structure your entire response in Markdown format.
        `;

        const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.render('doubt', { title: 'Snap & Solve - Solution', solution: text, error: null });

    } catch (error) {
        console.error(error);
        res.render('doubt', { title: 'Snap & Solve', solution: null, error: 'An error occurred while processing your request. Please try again.' });
    }
});



// --- AI HEALTH ANALYSIS ROUTE ---
// This route is necessary to fix the "404 Not Found" error.
// It handles POST requests with an image for analysis from the frontend.
router.post('/analyze-health-image', upload.single('healthImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    const analysisType = req.body.analysisType;
    let prompt = '';

    if (analysisType === 'skin') {
        prompt = `
            You are a very helpful AI health helper. Look closely at the picture of the skin problem.
Provide a clear explanation in a simple format like a notice board, with the following sections:
- **What We See (Observations):** Tell us exactly what the skin looks like (e.g., its color, shape, if it's bumpy or smooth, how big it is, where it is on the body).
- **What It Might Be (Possible Problems):** Based on the picture, name 2 or 3 common skin problems it could be (e.g., a common rash, a fungus/ringworm, an allergy). Briefly explain for each one why we think it might be that.
- **What to Do Next (Simple Steps):** Give simple advice on the immediate steps a person should take.
- **VERY IMPORTANT WARNING (CRITICAL DISCLAIMER):** End the entire message with this necessary warning in bold: "**Warning: This is advice from a helper computer (AI) only, NOT a doctor's final word. This information is only to help you understand better. You must see a proper doctor or a health worker (like a nurse or *vaidya*) to know for sure what the problem is and get the right medicine.**"
        `;
    } else if (analysisType === 'report') {
        prompt = `
           You are a very helpful AI health helper. Look closely at the picture of this health paper (like a blood report or X-ray result).
Provide a clear summary in a simple format like a notice board, with the following sections:
- **What This Paper Is (Report Summary):** Briefly say what kind of health paper this is (e.g., blood test, X-ray) and what it was trying to check.
- **The Main Findings (Key Results):** Point out and list the most important or noticeable results from this paper.
- **What High/Low Numbers Mean (Analysis of Unusual Values):** For any number that is outside the normal, healthy range, explain what that number measures and what being too **high** or too **low** might simply mean for the body.
- **Talk to Your Doctor About These (Areas for Doctor's Attention):** Highlight the specific results or points that you must discuss with your doctor or health worker.
- **VERY IMPORTANT WARNING (CRITICAL DISCLAIMER):** End the entire message with this necessary warning in bold: "**Warning: This is a simple explanation from a helper computer (AI) only, NOT a doctor's final word. A proper doctor or health worker must check this paper and tell you what it means for sure. Do not change any medicine or make any health decisions just based on this.**"
        `;
    } else {
        return res.status(400).json({ success: false, error: 'Invalid analysis type.' });
    }

    try {
        // EDITED CHANGE: Updated the model name to a more recent, compatible version.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, analysis: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ success: false, error: 'An error occurred while communicating with the AI. Please try again.' });
    }
});

// --- NEW ROUTE ---
// Route to render the Infinite Question Generator page
router.get('/generator', (req, res) => {
    res.render('generator', { title: 'Infinite Question Generator' });
});

// --- NEW ROUTE ---
// Route to render the AI Revision Tool page
router.get('/revision', (req, res) => {
    res.render('revision', { title: 'AI Revision & Mnemonics Tool' });
});

// --- NEW ROUTE ---
// Route to render the AI Mock Test page
router.get('/test', (req, res) => {
    // Tell EJS to use the new layout file for this route ONLY
    res.render('test', { 
        title: 'AI-Powered Mock Test', 
        layout: 'layout/test-layout' // Fixed path - relative to views directory
    });
});

// new route
router.get('/dashboard', (req, res) => {
    console.log("Dashboard route hit");
    // It tells the server to find and render the 'dashboard.ejs' file
    // and send it to the user's browser.
    res.render('dashboard', { title: 'Doctor\'s Dashboard' });
});

// Route for Medicine Delivery
router.get('/medicine-deli', (req, res) => {
    res.render('medicine_del', { title: 'Medicine Delivery' });
});

// Route to render the Medicine page
router.get('/medicine', (req, res) => {
    res.render('medicine', { title: 'Medicine Management' });
});


router.get('/testroute', (req, res) => {
    console.log("Test route hit");
    res.send("Test route is working");
});


module.exports = router;
