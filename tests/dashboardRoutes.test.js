const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../lib/prisma", () => ({
    user: {
        findUnique: jest.fn(),
    },
}));
jest.mock("../services/dashboardService", () => ({
    getDashboardStats: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const dashboardService = require("../services/dashboardService");
const app = require("../server");

describe("Dashboard Statistics API Authorization (GET /api/dashboard/stats)", () => {
    const patientCookie = ["careon_token=patient-token"];
    const doctorCookie = ["careon_token=doctor-token"];
    const adminCookie = ["careon_token=admin-token"];

    const mockStats = {
        totalPatients: 42,
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

        dashboardService.getDashboardStats.mockResolvedValue(mockStats);
    });

    test("unauthenticated request is rejected with 401 JSON", async () => {
        const res = await request(app).get("/api/dashboard/stats");

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: "Authentication required",
        });
        expect(dashboardService.getDashboardStats).not.toHaveBeenCalled();
    });

    test("PATIENT request is rejected with 403 JSON", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Cookie", patientCookie);

        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({
            success: false,
            message: "Access denied",
        });
        expect(dashboardService.getDashboardStats).not.toHaveBeenCalled();
    });

    test("DOCTOR request is allowed and returns dashboard statistics", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Cookie", doctorCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockStats);
        expect(dashboardService.getDashboardStats).toHaveBeenCalledTimes(1);
    });

    test("ADMIN request is allowed and returns dashboard statistics", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Cookie", adminCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockStats);
        expect(dashboardService.getDashboardStats).toHaveBeenCalledTimes(1);
    });
});
