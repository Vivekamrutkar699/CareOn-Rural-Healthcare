const request = require("supertest");
const app = require("../server");

describe("CareOn App Routes", () => {
    test("GET / should return homepage", async () => {
        const res = await request(app).get("/");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("CareOn");
    });

    test("GET /dashboard should return dashboard", async () => {
        const res = await request(app).get("/dashboard");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Dashboard");
    });

    test("GET /patients should return patients page", async () => {
        const res = await request(app).get("/patients");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Patients");
    });

    test("GET /telemedicine should return telemedicine page", async () => {
        const res = await request(app).get("/telemedicine");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Telemedicine");
    });

    test("GET /ai-assistant should return AI assistant page", async () => {
        const res = await request(app).get("/ai-assistant");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("AI Assistant");
    });

    test("GET /medicine should return medicine page", async () => {
        const res = await request(app).get("/medicine");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Medicine");
    });

    test("GET unknown route should return 404", async () => {
        const res = await request(app).get("/this-route-does-not-exist");

        expect(res.statusCode).toBe(404);
    });
});