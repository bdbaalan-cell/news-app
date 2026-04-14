const API = "https://news-app-backend-my3n.onrender.com";
let token = "";

// 🔐 LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
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
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  alert("User registered ✅");
});

// ➕ POST
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("content", document.getElementById("content").value);

  const fileInput = document.getElementById("image");
  if (fileInput.files[0]) {
    formData.append("image", fileInput.files[0]);
  }

  await fetch(`${API}/api/posts`, {
    method: "POST",
    headers: {
      "Authorization": token
    },
    body: formData
  });

  document.getElementById("postForm").reset();
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
  await fetch(`${API}/api/posts/${id}/like`, {
    method: "POST"
  });

  loadPosts();
}

// 💬 COMMENT
async function addComment(id) {
  const input = document.getElementById("comment-" + id);
  const text = input.value;

  if (!text) return;

  await fetch(`${API}/api/posts/${id}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  loadPosts();
}

// 🚀 LOAD ON START
loadPosts();