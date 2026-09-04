const express = require("express");
const patientService = require("../services/patientService");

const router = express.Router();

// Create patient
router.post("/", async (req, res) => {
    try {
        const patient = await patientService.createPatient(req.body);

        res.status(201).json({
            success: true,
            message: "Patient created successfully",
            data: patient,
        });
    } catch (error) {
        console.error("Create patient error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create patient",
        });
    }
});

// Get all patients
router.get("/", async (req, res) => {
    try {
        const patients = await patientService.getAllPatients();

        res.json({
            success: true,
            data: patients,
        });
    } catch (error) {
        console.error("Get patients error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch patients",
        });
    }
});

// Get patient by ID
router.get("/:id", async (req, res) => {
    try {
        const patient = await patientService.getPatientById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        console.error("Get patient error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch patient",
        });
    }
});

// Update patient
router.put("/:id", async (req, res) => {
    try {
        const patient = await patientService.updatePatient(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            message: "Patient updated successfully",
            data: patient,
        });
    } catch (error) {
        console.error("Update patient error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update patient",
        });
    }
});

// Delete patient
router.delete("/:id", async (req, res) => {
    try {
        await patientService.deletePatient(req.params.id);

        res.json({
            success: true,
            message: "Patient deleted successfully",
        });
    } catch (error) {
        console.error("Delete patient error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete patient",
        });
    }
});

module.exports = router;