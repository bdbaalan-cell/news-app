const API = "https://news-app-backend-my3n.onrender.com";

let token = "";
token = localStorage.getItem("token") || "";

// 🔐 LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Login successful ✅");
  } else {
    alert("Login failed ❌");
  }
});

// 👤 REGISTER
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;

  await fetch(`${API}/api/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  alert("User registered ✅");
});

// ➕ POST
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  if (!title || !content) {
    alert("Title and content required!");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);

  const file = document.getElementById("image").files[0];
  if (file) formData.append("image", file);

  await fetch(`${API}/api/posts`, {
    method: "POST",
    headers: { "Authorization": token },
    body: formData
  });

  loadPosts();
});

// 📥 LOAD POSTS
async function loadPosts() {
  const res = await fetch(`${API}/api/posts`);
  const posts = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  posts.reverse().forEach(post => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <h3>${post.title}</h3>
      <h4>👤 ${post.user || "Anonymous"}</h4>

      ${post.image ? `<img src="${API}/uploads/${post.image}" />` : ""}

      <p>${post.content}</p>

      <button onclick="likePost('${post._id}')">
        ❤️ Like (${post.likes || 0})
      </button>

      <div>
        <h4>Comments:</h4>
        ${(post.comments || []).map(c => `<p>💬 ${c.text}</p>`).join("")}
      </div>

      <input type="text" id="comment-${post._id}" placeholder="Write a comment">
      <button onclick="addComment('${post._id}')">Comment</button>
    `;

    feed.appendChild(div);
  });
}

// ❤️ LIKE
async function likePost(id) {
  await fetch(`${API}/api/posts/${id}/like`, { method: "POST" });
  loadPosts();
}

// 💬 COMMENT
async function addComment(id) {
  const text = document.getElementById("comment-" + id).value;
  if (!text) return;

  await fetch(`${API}/api/posts/${id}/comment`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text })
  });

  loadPosts();
}

// 🔓 LOGOUT
function logout() {
  localStorage.removeItem("token");
  token = "";
  alert("Logged out");
}

// 🚀 LOAD
loadPosts();

if (token) {
  console.log("User already logged in");
}