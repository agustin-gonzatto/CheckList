document.addEventListener('DOMContentLoaded', function() {
    fetchUsers();
});

function fetchUsers() {
    fetch('/api/v1/users/users')  // URL de tu API para obtener los usuarios
        .then(response => response.json())  // Convertimos la respuesta a JSON
        .then(data => {
            const tableBody = document.querySelector('#usersTable tbody');  // Seleccionamos el cuerpo de la tabla
            tableBody.innerHTML = '';  // Limpiamos cualquier contenido previo

            data.forEach(user => {  // Iteramos sobre la lista de usuarios
                const row = document.createElement('tr');  // Creamos una nueva fila para cada usuario
                
                const idCell = document.createElement('td');
                idCell.textContent = user.userID;
                row.appendChild(idCell);
                
                const nameCell = document.createElement('td');
                nameCell.textContent = user.name;  // Colocamos el nombre del usuario
                row.appendChild(nameCell);
                
                const emailCell = document.createElement('td');
                emailCell.textContent = user.email;  // Colocamos el correo del usuario
                row.appendChild(emailCell);
                
                tableBody.appendChild(row);  // Agregamos la fila al cuerpo de la tabla
            });
        })
        .catch(error => {
            console.error('Error al obtener usuarios:', error);
        });
}
