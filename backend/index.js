import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import fileRoutes from "./routes/fileRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";



dotenv.config();
const app = express();
// app.use(cors());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ Mongo connected"))
.catch(err=>console.error("❌ Mongo error", err));


app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/ai", aiRoutes);



// test protected route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Access granted to protected route ✅",
    userId: req.user.id
  });
});

app.get("/", (req,res)=>res.send("HealthMate server running"));
app.listen(5000, ()=>console.log("🚀 Server on port 5000"));
