import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static(
    path.join(currentDirectory, "uploads")
  )
);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Roomie2Homie backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Roomie2Homie API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", profileRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/*app.listen(PORT, () => {
  console.log(`Roomie2Homie backend running at http://localhost:${PORT}`);
});*/

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Roomie2Homie backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();