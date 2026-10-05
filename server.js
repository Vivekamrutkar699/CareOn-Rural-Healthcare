require("dotenv").config();

const http = require("http");
const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// EJS configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout/boilerplate");

// Routes
const appRoutes = require("./routes/appRoutes");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/", appRoutes);
app.use("/", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).send(
        err.message || "Internal Server Error"
    );
});

// HTTP & Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});

// WebRTC Signaling
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join telemedicine room
    socket.on("join-room", (roomId) => {
        if (!roomId || typeof roomId !== "string") {
            return;
        }

        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);

        // Notify existing room members that a new user joined
        socket.to(roomId).emit("user-joined", {
            socketId: socket.id,
        });
    });

    // WebRTC offer
    socket.on("offer", (data) => {
        if (!data || !data.roomId || !data.offer) {
            return;
        }

        socket.to(data.roomId).emit("offer", {
            offer: data.offer,
            socketId: socket.id,
        });
    });

    // WebRTC answer
    socket.on("answer", (data) => {
        if (!data || !data.roomId || !data.answer) {
            return;
        }

        socket.to(data.roomId).emit("answer", {
            answer: data.answer,
            socketId: socket.id,
        });
    });

    // ICE candidate
    socket.on("ice-candidate", (data) => {
        if (!data || !data.roomId || !data.candidate) {
            return;
        }

        socket.to(data.roomId).emit("ice-candidate", {
            candidate: data.candidate,
            socketId: socket.id,
        });
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Start server only when this file is executed directly
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`CareOn server running on http://localhost:${PORT}`);
    });
}

module.exports = app;