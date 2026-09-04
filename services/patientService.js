const prisma = require("../lib/prisma");

async function createPatient(data) {
    return prisma.patient.create({
        data: {
            patientId: data.patientId,
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender || null,
            phone: data.phone,
            email: data.email || null,
            address: data.address || null,
            bloodGroup: data.bloodGroup || null,
        },
    });
}

async function getAllPatients() {
    return prisma.patient.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
}

async function getPatientById(id) {
    return prisma.patient.findUnique({
        where: { id },
    });
}

async function updatePatient(id, data) {
    return prisma.patient.update({
        where: { id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : null,
            gender: data.gender || null,
            phone: data.phone,
            email: data.email || null,
            address: data.address || null,
            bloodGroup: data.bloodGroup || null,
        },
    });
}

async function deletePatient(id) {
    return prisma.patient.delete({
        where: { id },
    });
}

module.exports = {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
};