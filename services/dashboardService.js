const prisma = require("../lib/prisma");

async function getDashboardStats() {
    const totalPatients = await prisma.patient.count();

    return {
        totalPatients,
    };
}

module.exports = {
    getDashboardStats,
};