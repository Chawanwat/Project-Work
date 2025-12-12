require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

// --------- สร้าง Schema / Model ----------
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    linkText: { type: String, default: "Open project" },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

// ---------- middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- API ----------

// ดึง projects ทั้งหมด
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// เพิ่ม project (ตรวจรหัส + บันทึกลง MongoDB)
app.post("/api/projects", async (req, res) => {
  try {
    const { password, title, linkText, url } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ ok: false, message: "Incorrect password" });
    }

    if (!title || !url) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing title or url" });
    }

    const project = await Project.create({
      title,
      linkText: linkText || "Open project",
      url,
    });

    res.json({ ok: true, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ลบ project ตาม id
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ ok: false, message: "Incorrect password" });
    }

    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Project not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ---------- start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
