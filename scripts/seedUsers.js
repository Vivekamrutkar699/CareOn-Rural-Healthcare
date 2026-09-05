require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

async function createDevelopmentUsers() {
    const doctorPassword = process.env.DEV_DOCTOR_PASSWORD;
    const adminPassword = process.env.DEV_ADMIN_PASSWORD;

    if (!doctorPassword || !adminPassword) {
        throw new Error(
            "DEV_DOCTOR_PASSWORD and DEV_ADMIN_PASSWORD must be configured in .env"
        );
    }

    if (doctorPassword.length < 8 || adminPassword.length < 8) {
        throw new Error(
            "Development passwords must contain at least 8 characters."
        );
    }

    const doctorPasswordHash = await bcrypt.hash(doctorPassword, 12);
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    const doctor = await prisma.user.upsert({
        where: {
            email: "doctor@careon.local",
        },
        update: {
            name: "CareOn Doctor",
            passwordHash: doctorPasswordHash,
            role: "DOCTOR",
        },
        create: {
            name: "CareOn Doctor",
            email: "doctor@careon.local",
            passwordHash: doctorPasswordHash,
            role: "DOCTOR",
        },
    });

    const admin = await prisma.user.upsert({
        where: {
            email: "admin@careon.local",
        },
        update: {
            name: "CareOn Admin",
            passwordHash: adminPasswordHash,
            role: "ADMIN",
        },
        create: {
            name: "CareOn Admin",
            email: "admin@careon.local",
            passwordHash: adminPasswordHash,
            role: "ADMIN",
        },
    });

    console.log("Development users created successfully.");
    console.log(`Doctor: ${doctor.email} (${doctor.role})`);
    console.log(`Admin: ${admin.email} (${admin.role})`);
}

createDevelopmentUsers()
    .catch((error) => {
        console.error("Seed error:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });