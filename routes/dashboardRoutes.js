const express = require("express");
const dashboardService = require("../services/dashboardService");

const router = express.Router();

router.get("/stats", async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
        });
    }
});

module.exports = router;