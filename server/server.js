const bcrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.use(cors());
app.use(express.json());

// 🔐 SECRET KEY
const SECRET = "mysecretkey";

// 📁 Serve uploaded images
app.use("/uploads", express.static("uploads"));

// 🔗 MongoDB
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// 🧩 Schema
//post schema
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  likes: {
    type: Number,
    default: 0
  },
  comments: [
    {
      text: String
    }
  ]
});

const Post = mongoose.model("Post", postSchema);
// 👤 User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// 📦 Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 👤 REGISTER
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hashedPassword
  });

  await user.save();

  res.json({ message: "User registered securely ✅" });
});

// 🔐 LOGIN (admin + users)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  // admin login
  if (username === "admin" && password === "1234") {
    const token = jwt.sign({ user: "admin" }, SECRET);
    return res.json({ token });
  }

  // user login
  const user = await User.findOne({ username });

if (user && await bcrypt.compare(password, user.password)) {
  const token = jwt.sign({ user: username }, SECRET);
  res.json({ token });
} else {
  res.status(401).json({ message: "Invalid credentials" });
}
});

// ➕ CREATE POST (PROTECTED)
app.post("/api/posts", upload.single("image"), async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: "No token" });
  }

  try {
    jwt.verify(token, SECRET);

    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      image: req.file ? req.file.filename : ""
    });

    const saved = await newPost.save();
    res.json(saved);

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// 📥 GET POSTS
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

// ❤️ LIKE POST
app.post("/api/posts/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  post.likes += 1;
  await post.save();

  res.json({ likes: post.likes });
});

// test
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
// 💬 ADD COMMENT
app.post("/api/posts/:id/comment", async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  post.comments.push({ text: req.body.text });
  await post.save();

  res.json(post);
});