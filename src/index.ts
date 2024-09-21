import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/authRoutes.ts";
import psychologistRoutes from "./routes/psychologistRoutes.ts";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// WebSocket
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for your frontend origin
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const secret = process.env.JWT_SECRET || "your_jwt_secret";
  if (token) {
    jwt.verify(
      token,
      secret,
      (
        err: jwt.VerifyErrors | null,
        decoded: string | jwt.JwtPayload | undefined
      ) => {
        if (err) return next(new Error("Authentication error"));
        socket.data.user = decoded;
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.user.userId}`);

  socket.on("joinSession", (meetingLink) => {
    socket.join(meetingLink);
  });

  socket.on("message", (data) => {
    const { meetingLink, message } = data;
    io.to(meetingLink).emit("message", {
      user: socket.data.user,
      message,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.user.userId}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/psychologist", psychologistRoutes);
app.get("/", function (req, res) {
  res.send("Hello World");
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
