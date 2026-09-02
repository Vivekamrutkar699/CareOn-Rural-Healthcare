const request = require('supertest');
const express = require('express');
const app = require('../server'); // Import the server

describe('App Routes', () => {
    it('should render the home page', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('PrepAI - Home');
    });

    it('should render the doubt solver page', async () => {
        const res = await request(app).get('/doubt');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Snap & Solve Doubt Tutor');
    });

    it('should handle image upload and process with Gemini', async () => {
        const res = await request(app)
            .post('/solve-doubt')
            .attach('doubtImage', 'path/to/sample/image.jpg'); // Replace with a valid image path
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Snap & Solve - Solution');
    });

    it('should render the generator page', async () => {
        const res = await request(app).get('/generator');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Infinite Question Generator');
    });

    it('should render the revision page', async () => {
        const res = await request(app).get('/revision');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('AI Revision & Mnemonics Tool');
    });

    it('should render the test page', async () => {
        const res = await request(app).get('/test');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('AI-Powered Mock Test');
    });
});
