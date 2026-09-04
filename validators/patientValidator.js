const { body } = require("express-validator");

const patientValidationRules = [
    body("patientId")
        .trim()
        .notEmpty()
        .withMessage("Patient ID is required"),

    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isLength({ max: 50 })
        .withMessage("First name must be at most 50 characters"),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ max: 50 })
        .withMessage("Last name must be at most 50 characters"),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Enter a valid 10-digit Indian phone number"),

    body("email")
        .optional({ values: "falsy" })
        .trim()
        .isEmail()
        .withMessage("Enter a valid email address"),

    body("dateOfBirth")
        .optional({ values: "falsy" })
        .isISO8601()
        .withMessage("Enter a valid date of birth"),

    body("gender")
        .optional({ values: "falsy" })
        .isIn(["Male", "Female", "Other"])
        .withMessage("Gender must be Male, Female, or Other"),

    body("bloodGroup")
        .optional({ values: "falsy" })
        .isIn([
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-",
        ])
        .withMessage("Invalid blood group"),
];

module.exports = {
    patientValidationRules,
};