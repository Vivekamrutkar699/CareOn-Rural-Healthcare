const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../lib/prisma", () => ({
    user: {
        findUnique: jest.fn(),
    },
}));

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const app = require("../server");

describe("CareOn App Routes", () => {
    const doctorCookie = ["careon_token=doctor-token"];
    const patientCookie = ["careon_token=patient-token"];

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
    });

    test("GET / should return homepage without authentication", async () => {
        const res = await request(app).get("/");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("CareOn");
    });

    test("GET /dashboard should return dashboard for authenticated user", async () => {
        const res = await request(app)
            .get("/dashboard")
            .set("Cookie", doctorCookie);

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Dashboard");
    });

    test("GET /dashboard should redirect unauthenticated request to /login", async () => {
        const res = await request(app).get("/dashboard");

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("GET /patients should return patients page for DOCTOR", async () => {
        const res = await request(app)
            .get("/patients")
            .set("Cookie", doctorCookie);

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Patients");
    });

    test("GET /patients should deny access (403) for PATIENT role", async () => {
        const res = await request(app)
            .get("/patients")
            .set("Cookie", patientCookie);

        expect(res.statusCode).toBe(403);
        expect(res.text).toContain("Access Denied");
    });

    test("GET /telemedicine should return telemedicine page for authorized user", async () => {
        const res = await request(app)
            .get("/telemedicine")
            .set("Cookie", patientCookie);

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Telemedicine");
    });

    test("GET /ai-assistant should return AI assistant page for authorized user", async () => {
        const res = await request(app)
            .get("/ai-assistant")
            .set("Cookie", patientCookie);

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("AI Assistant");
    });

    test("GET /medicine should return medicine page for authenticated user", async () => {
        const res = await request(app)
            .get("/medicine")
            .set("Cookie", doctorCookie);

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Medicine");
    });

    test("GET unknown route should return 404", async () => {
        const res = await request(app).get("/this-route-does-not-exist");

        expect(res.statusCode).toBe(404);
    });
});
