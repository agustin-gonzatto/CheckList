document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch("https://codegarage.site/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.text();
        localStorage.setItem("bearer", data);
        window.location.href = "/dashboard.html";
      } else {
        document.getElementById("errorMsg").textContent = "Credenciales incorrectas";
      }
    } catch (e) {
      document.getElementById("errorMsg").textContent = "Error: " + e.message;
    }
  });