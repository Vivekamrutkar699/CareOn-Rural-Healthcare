const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../lib/prisma", () => ({
    user: {
        findUnique: jest.fn(),
    },
}));
jest.mock("../services/patientService", () => ({
    createPatient: jest.fn(),
    getAllPatients: jest.fn(),
    getPatientById: jest.fn(),
    updatePatient: jest.fn(),
    deletePatient: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const patientService = require("../services/patientService");
const app = require("../server");

describe("Patient API Authorization & Endpoints", () => {
    const unauthenticated = null;
    const patientCookie = ["careon_token=patient-token"];
    const doctorCookie = ["careon_token=doctor-token"];
    const adminCookie = ["careon_token=admin-token"];

    const mockPatient = {
        id: "pat-uuid-1",
        patientId: "PAT-001",
        firstName: "Ravi",
        lastName: "Sharma",
        phone: "9876543210",
        gender: "Male",
        bloodGroup: "O+",
    };

    const validPatientPayload = {
        patientId: "PAT-001",
        firstName: "Ravi",
        lastName: "Sharma",
        phone: "9876543210",
        gender: "Male",
        bloodGroup: "O+",
        dateOfBirth: "1990-01-01",
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockImplementation((token) => {
            if (!token || token === "invalid-token") {
                throw new Error("Invalid token");
            }
            return { userId: token };
        });

        prisma.user.findUnique.mockImplementation(({ where: { id } }) => {
            const users = {
                "doctor-token": {
                    id: "doc-1",
                    name: "Dr. Smith",
                    email: "doctor@careon.org",
                    role: "DOCTOR",
                },
                "admin-token": {
                    id: "admin-1",
                    name: "Admin Jane",
                    email: "admin@careon.org",
                    role: "ADMIN",
                },
                "patient-token": {
                    id: "pat-1",
                    name: "John Doe",
                    email: "patient@careon.org",
                    role: "PATIENT",
                },
            };
            return Promise.resolve(users[id] || null);
        });

        patientService.getAllPatients.mockResolvedValue([mockPatient]);
        patientService.getPatientById.mockResolvedValue(mockPatient);
        patientService.createPatient.mockResolvedValue(mockPatient);
        patientService.updatePatient.mockResolvedValue(mockPatient);
        patientService.deletePatient.mockResolvedValue(mockPatient);
    });

    describe("Unauthenticated requests (requireAuth)", () => {
        test("GET /api/patients is rejected and redirected to /login", async () => {
            const res = await request(app).get("/api/patients");

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
            expect(patientService.getAllPatients).not.toHaveBeenCalled();
        });

        test("POST /api/patients is rejected and redirected to /login", async () => {
            const res = await request(app)
                .post("/api/patients")
                .send(validPatientPayload);

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
            expect(patientService.createPatient).not.toHaveBeenCalled();
        });

        test("GET /api/patients/:id is rejected and redirected to /login", async () => {
            const res = await request(app).get("/api/patients/pat-uuid-1");

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
            expect(patientService.getPatientById).not.toHaveBeenCalled();
        });

        test("PUT /api/patients/:id is rejected and redirected to /login", async () => {
            const res = await request(app)
                .put("/api/patients/pat-uuid-1")
                .send(validPatientPayload);

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
            expect(patientService.updatePatient).not.toHaveBeenCalled();
        });

        test("DELETE /api/patients/:id is rejected and redirected to /login", async () => {
            const res = await request(app).delete("/api/patients/pat-uuid-1");

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
            expect(patientService.deletePatient).not.toHaveBeenCalled();
        });
    });

    describe("PATIENT role requests (requireRole denies PATIENT with 403)", () => {
        test("GET /api/patients is denied with 403", async () => {
            const res = await request(app)
                .get("/api/patients")
                .set("Cookie", patientCookie);

            expect(res.statusCode).toBe(403);
            expect(res.text).toContain("Access Denied");
            expect(patientService.getAllPatients).not.toHaveBeenCalled();
        });

        test("POST /api/patients is denied with 403", async () => {
            const res = await request(app)
                .post("/api/patients")
                .set("Cookie", patientCookie)
                .send(validPatientPayload);

            expect(res.statusCode).toBe(403);
            expect(res.text).toContain("Access Denied");
            expect(patientService.createPatient).not.toHaveBeenCalled();
        });

        test("GET /api/patients/:id is denied with 403", async () => {
            const res = await request(app)
                .get("/api/patients/pat-uuid-1")
                .set("Cookie", patientCookie);

            expect(res.statusCode).toBe(403);
            expect(res.text).toContain("Access Denied");
            expect(patientService.getPatientById).not.toHaveBeenCalled();
        });

        test("PUT /api/patients/:id is denied with 403", async () => {
            const res = await request(app)
                .put("/api/patients/pat-uuid-1")
                .set("Cookie", patientCookie)
                .send(validPatientPayload);

            expect(res.statusCode).toBe(403);
            expect(res.text).toContain("Access Denied");
            expect(patientService.updatePatient).not.toHaveBeenCalled();
        });

        test("DELETE /api/patients/:id is denied with 403", async () => {
            const res = await request(app)
                .delete("/api/patients/pat-uuid-1")
                .set("Cookie", patientCookie);

            expect(res.statusCode).toBe(403);
            expect(res.text).toContain("Access Denied");
            expect(patientService.deletePatient).not.toHaveBeenCalled();
        });
    });

    describe("DOCTOR role requests (requireRole allows DOCTOR)", () => {
        test("GET /api/patients is allowed and returns patient list", async () => {
            const res = await request(app)
                .get("/api/patients")
                .set("Cookie", doctorCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([mockPatient]);
            expect(patientService.getAllPatients).toHaveBeenCalledTimes(1);
        });

        test("POST /api/patients is allowed and creates a patient", async () => {
            const res = await request(app)
                .post("/api/patients")
                .set("Cookie", doctorCookie)
                .send(validPatientPayload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Patient created successfully");
            expect(res.body.data).toEqual(mockPatient);
            expect(patientService.createPatient).toHaveBeenCalledTimes(1);
        });

        test("GET /api/patients/:id is allowed and returns single patient", async () => {
            const res = await request(app)
                .get("/api/patients/pat-uuid-1")
                .set("Cookie", doctorCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockPatient);
            expect(patientService.getPatientById).toHaveBeenCalledWith("pat-uuid-1");
        });

        test("PUT /api/patients/:id is allowed and updates patient", async () => {
            const res = await request(app)
                .put("/api/patients/pat-uuid-1")
                .set("Cookie", doctorCookie)
                .send(validPatientPayload);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Patient updated successfully");
            expect(patientService.updatePatient).toHaveBeenCalledWith(
                "pat-uuid-1",
                expect.any(Object)
            );
        });

        test("DELETE /api/patients/:id is allowed and deletes patient", async () => {
            const res = await request(app)
                .delete("/api/patients/pat-uuid-1")
                .set("Cookie", doctorCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Patient deleted successfully");
            expect(patientService.deletePatient).toHaveBeenCalledWith("pat-uuid-1");
        });
    });

    describe("ADMIN role requests (requireRole allows ADMIN)", () => {
        test("GET /api/patients is allowed for ADMIN", async () => {
            const res = await request(app)
                .get("/api/patients")
                .set("Cookie", adminCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([mockPatient]);
            expect(patientService.getAllPatients).toHaveBeenCalledTimes(1);
        });

        test("POST /api/patients is allowed for ADMIN", async () => {
            const res = await request(app)
                .post("/api/patients")
                .set("Cookie", adminCookie)
                .send(validPatientPayload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Patient created successfully");
            expect(patientService.createPatient).toHaveBeenCalledTimes(1);
        });

        test("DELETE /api/patients/:id is allowed for ADMIN", async () => {
            const res = await request(app)
                .delete("/api/patients/pat-uuid-1")
                .set("Cookie", adminCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Patient deleted successfully");
            expect(patientService.deletePatient).toHaveBeenCalledWith("pat-uuid-1");
        });
    });
});
