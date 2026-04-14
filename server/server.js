const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const SECRET = "mysecretkey";

app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 🧩 Schema
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  user: String,
  likes: { type: Number, default: 0 },
  comments: [{ text: String }]
});

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// 📦 Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// 👤 REGISTER
app.post("/api/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  await new User({ username: req.body.username, password: hashed }).save();
  res.json({ message: "User registered" });
});

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });

  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ user: user.username }, SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// ➕ CREATE POST
app.post("/api/posts", upload.single("image"), async (req, res) => {
  const token = req.headers.authorization;

  if (!token) return res.status(403).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET);

    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      image: req.file ? req.file.filename : "",
      user: decoded.user
    });

    await post.save();
    res.json(post);

  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// 📥 GET POSTS
app.get("/api/posts", async (req, res) => {
  res.json(await Post.find().sort({ _id: -1 }));
});

// ❤️ LIKE
app.post("/api/posts/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.likes++;
  await post.save();
  res.json(post);
});

// 💬 COMMENT
app.post("/api/posts/:id/comment", async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ text: req.body.text });
  await post.save();
  res.json(post);
});

app.listen(5000, () => console.log("Server running"));