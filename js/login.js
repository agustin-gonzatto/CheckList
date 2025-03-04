document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        document.getElementById("errorMsg").textContent = "Todos los campos son obligatorios.";
        return;
    }

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.token);
            alert("Inicio de sesión exitoso");
            window.location.href = "/dashboard.html"; 
        } else {
            throw new Error("Credenciales incorrectas o cuenta inactiva.");
        }
    } catch (error) {
        document.getElementById("errorMsg").textContent = error.message;
    }
});