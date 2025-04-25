document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = ''; // ¡¡¡ AJUSTA ESTA URL A TU BACKEND !!!

    // --- Elementos del DOM ---
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authStatus = document.getElementById('auth-status'); // Usado para mensajes de estado de auth
    const userInfoArea = document.getElementById('user-info-area'); // Elemento para info de usuario y logout
    const dashboardsSection = document.getElementById('dashboards-section');
    const dashboardList = document.getElementById('dashboard-list');
    const addDashboardForm = document.getElementById('addDashboardForm');
    const newDashboardTitleInput = document.getElementById('new-dashboard-title');
    const dashboardStatus = document.getElementById('dashboard-status');
    const checklistsSection = document.getElementById('checklists-section');
    const checklistSectionTitle = document.getElementById('checklist-section-title');
    const checklistList = document.getElementById('checklist-list');
    const addChecklistForm = document.getElementById('addChecklistForm');
    const newChecklistTitleInput = document.getElementById('new-checklist-title');
    const checklistStatus = document.getElementById('checklist-status');
    const itemsSection = document.getElementById('items-section');
    const itemSectionTitle = document.getElementById('item-section-title');
    const itemList = document.getElementById('item-list');
    const addItemForm = document.getElementById('addItemForm');
    const newItemDescriptionInput = document.getElementById('new-item-description');
    const itemStatus = document.getElementById('item-status');

    // --- Estado de la aplicación ---
    let authToken = null;
    let selectedDashboardId = null;
    let selectedChecklistId = null;
    let loggedInUsername = null; // Para almacenar el nombre de usuario

    // --- Funciones Auxiliares (apiFetch, showStatus) ---
    function showStatus(element, message, isError = false) {
        element.textContent = message;
        element.className = 'status-message'; // Reset class
        if (message) {
            element.classList.add(isError ? 'error' : 'success');
        }
    }

    async function apiFetch(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 204) {
                return { ok: true, data: null };
            }
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                 data = await response.json();
            } else {
                 data = await response.text();
            }
            if (!response.ok) {
                const errorMessage = (typeof data === 'object' && data?.message) ? data.message : (data || response.statusText);
                console.error(`API Error ${response.status}: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            return { ok: true, data };
        } catch (error) {
            console.error('Fetch Error:', error);
            return { ok: false, error: error.message || 'Network error or invalid response' };
        }
    }

    // --- Funciones de UI (Revertidas para Routing Interno, con User Info) ---

    // Función principal para actualizar la UI basada SOLO en el estado de autenticación y selecciones internas
    function updateUIBasedOnAuthState() {
        // Ocultar todas las secciones primero
        authSection.style.display = 'none';
        mainContent.style.display = 'none';
        dashboardsSection.style.display = 'none';
        checklistsSection.style.display = 'none';
        itemsSection.style.display = 'none';
        userInfoArea.innerHTML = ''; // Limpiar área de info de usuario

        // Limpiar listas y estados seleccionados al cerrar sesión
        if (!authToken) {
             dashboardList.innerHTML = '';
             checklistList.innerHTML = '';
             itemList.innerHTML = '';
             selectedDashboardId = null;
             selectedChecklistId = null;
        }


        showStatus(authStatus, '');
        showStatus(dashboardStatus, '');
        showStatus(checklistStatus, '');
        showStatus(itemStatus, '');

        // Lógica de visualización basada en el estado de autenticación y selecciones
        if (authToken) {

            mainContent.style.display = 'block';
            displayUserInfo(); // Mostrar info de usuario y botón de logout
            dashboardsSection.style.display = 'block'; // Siempre mostrar dashboards si está autenticado
            fetchDashboards(); // Recargar dashboards al entrar a la vista principal

            if (selectedDashboardId) {
                 checklistsSection.style.display = 'block'; // Mostrar checklists si hay dashboard seleccionado
                 // No necesitamos fetchChecklists aquí, ya se llama en handleDashboardSelect
                 if (selectedChecklistId) {
                      itemsSection.style.display = 'block'; // Mostrar items si hay checklist seleccionada
                      // No necesitamos fetchChecklistItems aquí, ya se llama en handleChecklistSelect
                 }
            }

        } else {
            // Usuario no autenticado
            authSection.style.display = 'block'; // Mostrar sección de autenticación
        }
    }

    // Función para mostrar la información del usuario y el botón de logout
    function displayUserInfo() {
        userInfoArea.innerHTML = ''; // Limpiar contenido previo
        if (loggedInUsername) {
            const userSpan = document.createElement('span');
            userSpan.textContent = `Usuario: ${loggedInUsername}`;
            userSpan.style.marginRight = '10px'; // Espacio entre nombre y botón

            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar Sesión';
            logoutButton.className = 'logout-button'; // Puedes añadir estilos CSS para esta clase
            logoutButton.addEventListener('click', logoutUser);

            userInfoArea.appendChild(userSpan);
            userInfoArea.appendChild(logoutButton);
        }
    }


    // Display functions (igual que antes, no manejan ocultar/mostrar secciones)
    function displayDashboards(dashboards) {
        dashboardList.innerHTML = '';
        if (!dashboards || dashboards.length === 0) {
            dashboardList.innerHTML = '<li>No tienes dashboards. ¡Crea uno!</li>';
            return;
        }
        dashboards.forEach(dashboard => {
            const li = document.createElement('li');
            li.dataset.id = dashboard.id;

            const textSpan = document.createElement('span');
            textSpan.textContent = `${dashboard.title} (Creado: ${new Date(dashboard.createdAt).toLocaleDateString()})`;
            textSpan.className = 'item-text';
            // Revertido: Usar handleDashboardSelect directamente
            textSpan.onclick = () => handleDashboardSelect(dashboard.id, li);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'edit-btn';
            editButton.onclick = (e) => {
                e.stopPropagation(); // Prevent triggering li click
                handleEditDashboard(dashboard.id, dashboard.title);
            };

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = (e) => {
                 e.stopPropagation(); // Prevent triggering li click
                 handleDeleteDashboard(dashboard.id);
            };

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);
            li.appendChild(textSpan);
            li.appendChild(actionsDiv);

            if (dashboard.id === selectedDashboardId) {
                 li.classList.add('selected');
            }
            dashboardList.appendChild(li);
        });
    }

    function displayChecklists(checklists) {
         checklistList.innerHTML = '';
         if (!checklists || checklists.length === 0) {
              checklistList.innerHTML = '<li>No hay checklists en este dashboard.</li>';
              return;
         }
         checklists.forEach(checklist => {
              const li = document.createElement('li');
              li.dataset.id = checklist.id;

              const textSpan = document.createElement('span');
              textSpan.textContent = `${checklist.title}`;
              textSpan.className = 'item-text';
              // Revertido: Usar handleChecklistSelect directamente
              textSpan.onclick = () => handleChecklistSelect(checklist.id, li);

              const actionsDiv = document.createElement('div');
              actionsDiv.className = 'actions';

              const editButton = document.createElement('button');
              editButton.textContent = 'Editar';
              editButton.className = 'edit-btn';
              editButton.onclick = (e) => {
                   e.stopPropagation();
                   handleEditChecklist(checklist.id, checklist.title);
              };

              const deleteButton = document.createElement('button');
              deleteButton.textContent = 'Eliminar';
              deleteButton.className = 'delete-btn';
              deleteButton.onclick = (e) => {
                   e.stopPropagation();
                   handleDeleteChecklist(checklist.id);
              };

              actionsDiv.appendChild(editButton);
              actionsDiv.appendChild(deleteButton);
              li.appendChild(textSpan);
              li.appendChild(actionsDiv);

              if (checklist.id === selectedChecklistId) {
                   li.classList.add('selected');
              }
              checklistList.appendChild(li);
         });
    }

    function displayChecklistItems(items) {
         itemList.innerHTML = '';
         if (!items || items.length === 0) {
              itemList.innerHTML = '<li>No hay ítems en esta checklist.</li>';
              return;
         }
         items.forEach(item => {
              const li = document.createElement('li');
              li.dataset.id = item.id;
              li.className = item.completed ? 'completed-item' : ''; // Clase para ítems completados

              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.checked = item.completed;
              checkbox.className = 'item-checkbox';
              checkbox.addEventListener('change', () => handleToggleItemCompletion(selectedChecklistId, item.id, checkbox.checked));


              const textSpan = document.createElement('span');
              textSpan.textContent = `${item.description}`;
              textSpan.className = 'item-text';
              // No action on text click for items for now

              const actionsDiv = document.createElement('div');
              actionsDiv.className = 'actions';

              const editButton = document.createElement('button');
              editButton.textContent = 'Editar';
              editButton.className = 'edit-btn';
              editButton.onclick = (e) => {
                   e.stopPropagation();
                   handleEditItem(selectedChecklistId, item.id, item.description); // Pass current description
              };

              const deleteButton = document.createElement('button');
              deleteButton.textContent = 'Eliminar';
              deleteButton.className = 'delete-btn';
              deleteButton.onclick = (e) => {
                   e.stopPropagation();
                   handleDeleteItem(selectedChecklistId, item.id);
              };

              actionsDiv.appendChild(editButton);
              actionsDiv.appendChild(deleteButton);

              li.appendChild(checkbox); // Añadir checkbox
              li.appendChild(textSpan);
              li.appendChild(actionsDiv);

              itemList.appendChild(li);
         });
    }

    // --- Lógica de API (Login, Register, Logout, Fetch - Modificadas para User Info) ---
    async function loginUser(username, password) {
        const result = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        if (result.ok) {
            // Asumiendo que el backend devuelve el token Y el nombre de usuario en el login
            // Si tu backend solo devuelve el token, necesitarías otro endpoint para obtener la info del usuario
            authToken = result.data.token; // Ajusta según la estructura de tu respuesta de backend
            loggedInUsername = result.data.username; // Ajusta según la estructura de tu respuesta de backend
            localStorage.setItem("authToken",authToken);
            localStorage.setItem("username",loggedInUsername);
            showStatus(authStatus, 'Login exitoso!', false);
            updateUIBasedOnAuthState(); // Actualizar UI después del login
        } else {
            showStatus(authStatus, `Error de Login: ${result.error}`, true);
            authToken = null;
            loggedInUsername = null;
            updateUIBasedOnAuthState(); // Actualizar UI en caso de error
        }
    }
    async function registerUser(username, email, password) {
        const result = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
        if (result.ok) {
            showStatus(authStatus, 'Registro exitoso. Por favor, haz login.', false);
            registerForm.reset();
        } else {
            showStatus(authStatus, `Error de Registro: ${result.error}`, true);
        }
    }
    function logoutUser() {
        authToken = null;
        loggedInUsername = null;
        selectedDashboardId = null;
        selectedChecklistId = null;
        showStatus(authStatus, 'Has cerrado sesión.');
        localStorage.clear();
        updateUIBasedOnAuthState(); // Actualizar UI después del logout
    }
    async function fetchDashboards() {
        showStatus(dashboardStatus, 'Cargando dashboards...');
        const result = await apiFetch('/api/dashboards');
        if (result.ok) {
            displayDashboards(result.data);
            showStatus(dashboardStatus, '');
        } else {
            showStatus(dashboardStatus, `Error al cargar dashboards: ${result.error}`, true);
            displayDashboards([]);
        }
    }
     async function createDashboard(title) {
         showStatus(dashboardStatus, 'Creando dashboard...');
         const result = await apiFetch('/api/dashboards', { method: 'POST', body: JSON.stringify({ title }) });
         if (result.ok) {
             showStatus(dashboardStatus, 'Dashboard creado.', false);
             fetchDashboards(); // Recargar dashboards
             newDashboardTitleInput.value = '';
         } else {
             showStatus(dashboardStatus, `Error al crear dashboard: ${result.error}`, true);
         }
     }
    async function fetchChecklists(dashboardId) {
        showStatus(checklistStatus, 'Cargando checklists...');
        checklistsSection.style.display = 'block'; // Mostrar sección de checklists
        itemsSection.style.display = 'none'; // Ocultar sección de items al cambiar de dashboard
        selectedChecklistId = null; // Limpiar checklist seleccionada
        itemList.innerHTML = ''; // Limpiar lista de items

        const result = await apiFetch(`/api/checklists/dashboard/${dashboardId}`);
        if (result.ok) {
            const selectedDashboardLi = dashboardList.querySelector(`li[data-id="${dashboardId}"]`);
            checklistSectionTitle.textContent = `Checklists en "${selectedDashboardLi ? selectedDashboardLi.querySelector('.item-text').textContent.split(' (')[0] : 'Dashboard'}"`;
            displayChecklists(result.data);
            showStatus(checklistStatus, '');
        } else {
            checklistSectionTitle.textContent = `Checklists`;
            showStatus(checklistStatus, `Error al cargar checklists: ${result.error}`, true);
            displayChecklists([]);
        }
    }
     async function createChecklist(dashboardId, title) {
         if (!dashboardId) { showStatus(checklistStatus, 'Error: No hay dashboard seleccionado.', true); return; }
         showStatus(checklistStatus, 'Creando checklist...');
         const result = await apiFetch('/api/checklists', { method: 'POST', body: JSON.stringify({ title: title, dashboardId: dashboardId }) });
         if (result.ok) {
             showStatus(checklistStatus, 'Checklist creada.', false);
             fetchChecklists(dashboardId); // Recargar checklists
             newChecklistTitleInput.value = '';
         } else {
             showStatus(checklistStatus, `Error al crear checklist: ${result.error}`, true);
         }
     }
    async function fetchChecklistItems(checklistId) {
        showStatus(itemStatus, 'Cargando ítems...');
        itemsSection.style.display = 'block'; // Mostrar sección de items

        const result = await apiFetch(`/api/checklists/${checklistId}/items`);
        if (result.ok) {
            const selectedChecklistLi = checklistList.querySelector(`li[data-id="${checklistId}"]`);
            itemSectionTitle.textContent = `Items en "${selectedChecklistLi ? selectedChecklistLi.querySelector('.item-text').textContent : 'Checklist'}"`;
            displayChecklistItems(result.data);
            showStatus(itemStatus, '');
        } else {
            itemSectionTitle.textContent = `Items`;
            showStatus(itemStatus, `Error al cargar ítems: ${result.error}`, true);
            displayChecklistItems([]);
        }
    }
     async function createChecklistItem(checklistId, description) {
         if (!checklistId) { showStatus(itemStatus, 'Error: No hay checklist seleccionada.', true); return; }
         showStatus(itemStatus, 'Creando ítem...');
         const result = await apiFetch(`/api/checklists/${checklistId}/items`, { method: 'POST', body: JSON.stringify({ description: description, completed: false }) });
         if (result.ok) {
             showStatus(itemStatus, 'Ítem creado.', false);
             fetchChecklistItems(checklistId); // Recargar items
             newItemDescriptionInput.value = '';
         } else {
             showStatus(itemStatus, `Error al crear ítem: ${result.error}`, true);
         }
     }

    // --- Lógica de API (Edit/Delete y Toggle Completion) ---

    async function editDashboard(id, newTitle) {
        showStatus(dashboardStatus, 'Editando dashboard...');
        const result = await apiFetch(`/api/dashboards/${id}`, {
             method: 'PUT',
             body: JSON.stringify({ title: newTitle })
        });
         if (result.ok) {
             showStatus(dashboardStatus, 'Dashboard actualizado.', false);
             fetchDashboards(); // Recargar
         } else {
             showStatus(dashboardStatus, `Error al editar dashboard: ${result.error}. Endpoint podría no existir.`, true);
         }
    }

    async function deleteDashboard(id) {
         showStatus(dashboardStatus, 'Eliminando dashboard...');
         const result = await apiFetch(`/api/dashboards/${id}`, { method: 'DELETE' });

         if (result.ok) {
             showStatus(dashboardStatus, 'Dashboard eliminado.', false);
             if (id === selectedDashboardId) { // Si el dashboard eliminado era el seleccionado
                 selectedDashboardId = null;
                 selectedChecklistId = null;
                 checklistsSection.style.display = 'none';
                 itemsSection.style.display = 'none';
             }
             fetchDashboards(); // Recargar
         } else {
             showStatus(dashboardStatus, `Error al eliminar dashboard: ${result.error}. Endpoint podría no existir.`, true);
         }
    }

     async function editChecklist(id, newTitle) {
         showStatus(checklistStatus, 'Editando checklist...');
         const result = await apiFetch(`/api/checklists/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ title: newTitle, dashboardId: selectedDashboardId })
         });
         if (result.ok) {
              showStatus(checklistStatus, 'Checklist actualizada.', false);
              fetchChecklists(selectedDashboardId); // Recargar checklists del dashboard actual
         } else {
              showStatus(checklistStatus, `Error al editar checklist: ${result.error}`, true);
         }
     }

     async function deleteChecklist(id) {
         showStatus(checklistStatus, 'Eliminando checklist...');
         const result = await apiFetch(`/api/checklists/${id}`, { method: 'DELETE' });

         if (result.ok) {
              showStatus(checklistStatus, 'Checklist eliminada.', false);
              if (id === selectedChecklistId) { // Si la eliminada era la seleccionada
                  selectedChecklistId = null;
                  itemsSection.style.display = 'none';
              }
              fetchChecklists(selectedDashboardId); // Recargar checklists del dashboard actual
         } else {
              showStatus(checklistStatus, `Error al eliminar checklist: ${result.error}`, true);
         }
     }

    async function editChecklistItem(checklistId, itemId, newDescription) {
         showStatus(itemStatus, 'Editando ítem...');
         // Nota: Esta función ahora solo edita la descripción.
         // La función toggleChecklistItemCompletion maneja el estado 'completed'.
         const result = await apiFetch(`/api/checklists/${checklistId}/items/${itemId}`, {
              method: 'PUT',
              body: JSON.stringify({ description: newDescription })
         });
         if (result.ok) {
              showStatus(itemStatus, 'Ítem actualizado.', false);
              fetchChecklistItems(checklistId); // Recargar items de la checklist actual
         } else {
              showStatus(itemStatus, `Error al editar ítem: ${result.error}`, true);
         }
    }

     async function deleteChecklistItem(checklistId, itemId) {
         showStatus(itemStatus, 'Eliminando ítem...');
         const result = await apiFetch(`/api/checklists/${checklistId}/items/${itemId}`, { method: 'DELETE' });

         if (result.ok) {
              showStatus(itemStatus, 'Ítem eliminado.', false);
              fetchChecklistItems(checklistId); // Recargar items de la checklist actual
         } else {
              showStatus(itemStatus, `Error al eliminar ítem: ${result.error}`, true);
         }
     }

     // Función para cambiar el estado de completado de un ítem (igual que antes)
     async function toggleChecklistItemCompletion(checklistId, itemId, completedStatus) {
         showStatus(itemStatus, 'Actualizando estado del ítem...');
         const result = await apiFetch(`/api/checklists/${checklistId}/items/${itemId}`, {
             method: 'PATCH', // O PATCH, dependiendo de tu backend
             body: JSON.stringify({ completed: completedStatus })
         });

         if (result.ok) {
             showStatus(itemStatus, 'Estado del ítem actualizado.', false);
             fetchChecklistItems(checklistId); // Recargar items para reflejar el cambio
         } else {
             showStatus(itemStatus, `Error al actualizar estado del ítem: ${result.error}`, true);
         }
     }


    // --- Manejadores de Eventos (Formularios) ---
    loginForm.addEventListener('submit', (e) => { e.preventDefault(); loginUser(document.getElementById('login-username').value, document.getElementById('login-password').value); });
    registerForm.addEventListener('submit', (e) => { e.preventDefault(); registerUser(document.getElementById('register-username').value, document.getElementById('register-email').value, document.getElementById('register-password').value); });
    // El listener de logout ahora está en el botón creado dinámicamente en displayUserInfo
    addDashboardForm.addEventListener('submit', (e) => { e.preventDefault(); createDashboard(newDashboardTitleInput.value); });
    addChecklistForm.addEventListener('submit', (e) => { e.preventDefault(); createChecklist(selectedDashboardId, newChecklistTitleInput.value); });
    addItemForm.addEventListener('submit', (e) => { e.preventDefault(); createChecklistItem(selectedChecklistId, newItemDescriptionInput.value); });

    // --- Manejadores de Eventos (Select, Edit/Delete Buttons y Toggle Completion) ---

    // Revertido: Manejador de selección de Dashboard
    function handleDashboardSelect(dashboardId, listItemElement) {
        dashboardList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        listItemElement.classList.add('selected');
        selectedDashboardId = dashboardId;
        selectedChecklistId = null; // Limpiar checklist seleccionada al cambiar de dashboard
        itemsSection.style.display = 'none'; // Ocultar items al cambiar de dashboard
        itemList.innerHTML = ''; // Limpiar lista de items
        fetchChecklists(dashboardId); // Cargar checklists para el dashboard seleccionado
    }

    // Revertido: Manejador de selección de Checklist
     function handleChecklistSelect(checklistId, listItemElement) {
        checklistList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        listItemElement.classList.add('selected');
        selectedChecklistId = checklistId;
        fetchChecklistItems(checklistId); // Cargar items para la checklist seleccionada
     }

     function handleEditDashboard(dashboardId, currentTitle) {
          const newTitle = prompt("Nuevo título para el Dashboard:", currentTitle);
          if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
               editDashboard(dashboardId, newTitle.trim());
          } else if (newTitle !== null) { // Prompt not cancelled
              showStatus(dashboardStatus, 'Edición cancelada o título sin cambios.', true);
          }
     }

     function handleDeleteDashboard(dashboardId) {
         if (confirm(`¿Estás seguro de que quieres eliminar este dashboard? Esta acción NO se puede rehacer.`)) {
              deleteDashboard(dashboardId);
         }
     }

     function handleEditChecklist(checklistId, currentTitle) {
          const newTitle = prompt("Nuevo título para la Checklist:", currentTitle);
          if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
               editChecklist(checklistId, newTitle.trim());
          } else if (newTitle !== null) {
              showStatus(checklistStatus, 'Edición cancelada o título sin cambios.', true);
          }
     }

     function handleDeleteChecklist(checklistId) {
          if (confirm(`¿Estás seguro de que quieres eliminar esta checklist?`)) {
               deleteChecklist(checklistId);
          }
     }

     function handleEditItem(checklistId, itemId, currentDescription) {
          const newDescription = prompt("Nueva descripción para el Item:", currentDescription);
          if (newDescription && newDescription.trim() !== '' && newDescription !== currentDescription) {
               editChecklistItem(checklistId, itemId, newDescription.trim());
          } else if (newDescription !== null) {
              showStatus(itemStatus, 'Edición cancelada o descripción sin cambios.', true);
          }
     }

     function handleDeleteItem(checklistId, itemId) {
          if (confirm(`¿Estás seguro de que quieres eliminar este ítem?`)) {
               deleteChecklistItem(checklistId, itemId);
          }
     }

     // Manejador para el cambio de estado del checkbox del ítem (igual que antes)
     function handleToggleItemCompletion(checklistId, itemId, completedStatus) {
         toggleChecklistItemCompletion(checklistId, itemId, completedStatus);
     }


    // --- Inicialización ---

    // No necesitamos escuchar popstate ya que no usamos el historial del navegador para el routing
    // window.onpopstate = () => { ... };

    // Inicializar la UI basada en el estado de autenticación al cargar la página
    // Si necesitas persistencia de login (guardar el token en localStorage), cárgalo aquí:
     const storedAuthToken = localStorage.getItem('authToken');
     if (storedAuthToken) {
         authToken = storedAuthToken;
     loggedInUsername = localStorage.getItem('username');
     }

    updateUIBasedOnAuthState(); // Llamar para renderizar la vista inicial
});
