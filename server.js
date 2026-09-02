require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const app = express();

const PORT = process.env.PORT || 5000;

// -------------------------
// Middleware
// -------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);

// -------------------------
// Routes
// -------------------------

app.use("/", require("./routes/appRoutes"));

// -------------------------
// Health Check
// -------------------------

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CareOn API is running",
        environment: process.env.NODE_ENV || "development"
    });
});

// -------------------------
// 404 Handler
// -------------------------

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// -------------------------
// Error Handler
// -------------------------

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// -------------------------
// Start Server
// -------------------------

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`CareOn server running on http://localhost:${PORT}`);
    });
}

module.exports = app;