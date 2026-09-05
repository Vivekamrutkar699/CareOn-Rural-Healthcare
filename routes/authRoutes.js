const express = require("express");

const {
    registerUser,
    loginUser,
} = require("../services/authService");

const router = express.Router();

router.get("/login", (req, res) => {
    res.render("auth/login", {
        title: "Login",
    });
});

router.get("/register", (req, res) => {
    res.render("auth/register", {
        title: "Create Account",
    });
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send("All fields are required.");
        }

        if (password.length < 8) {
            return res
                .status(400)
                .send("Password must contain at least 8 characters.");
        }

        await registerUser({
            name,
            email,
            password,
        });

        return res.redirect("/login");
    } catch (error) {
        console.error("Registration error:", error);

        return res
            .status(error.status || 500)
            .send(error.message || "Unable to create account.");
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Email and password are required.");
        }

        const result = await loginUser({
            email,
            password,
        });

        res.cookie("careon_token", result.token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.redirect("/dashboard");
    } catch (error) {
        console.error("Login error:", error);

        return res
            .status(error.status || 500)
            .send(error.message || "Unable to login.");
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("careon_token");

    return res.redirect("/login");
});

module.exports = router;