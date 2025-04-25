document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Obtener valores del formulario
    const name = document.getElementById("name").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
/*
    // Validaciones básicas
    if (!name || !lastname || !username || !email || !password) {
        document.getElementById("errorMsg").textContent = "Todos los campos son obligatorios.";
        return;
    }

    // Validar formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById("errorMsg").textContent = "Por favor, introduce un correo electrónico válido.";
        return;
    }

    // Validar fortaleza de la contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(password)) {
        document.getElementById("errorMsg").textContent =
            "La contraseña debe tener al menos 10 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales.";
        return;
    }
*/
    // Crear objeto con los datos del formulario
    const formData = {
        username: username,
        password: password,
        name: name,
        lastname: lastname,
        email: email
    };

    try {
        // Enviar datos al servidor
        const response = await fetch("https://codegarage.site/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        // Manejar la respuesta del servidor
        if (response.ok) {
            alert("Registro exitoso. Verifica tu correo para activar la cuenta.");
            window.location.href = "/login.html";
        } else {
            const errorData = await response.json();
            document.getElementById("errorMsg").textContent =
                "Error en el registro. Por favor, inténtalo de nuevo.";
        }
    } catch (error) {
        console.log("Error en la solicitud:", error);
        document.getElementById("errorMsg").textContent =
            "Error de conexión. Por favor, inténtalo de nuevo más tarde.";
    }
            
});