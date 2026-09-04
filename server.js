require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// EJS configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout/boilerplate");

// Routes
const appRoutes = require("./routes/appRoutes");
const patientRoutes = require("./routes/patientRoutes");

app.use("/", appRoutes);
app.use("/api/patients", patientRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).send(
        err.message || "Internal Server Error"
    );
});

// Start server only when this file is executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`CareOn server running on http://localhost:${PORT}`);
    });
}

module.exports = app;