// checklist.js
const token = localStorage.getItem('bearer');
const currentDashboardId = localStorage.getItem("DID");
const checklistsContainer = document.getElementById('checklistsContainer');

// Cargar checklists al iniciar
document.addEventListener('DOMContentLoaded', () => {
    if (!token) redirectToLogin();
    if (!currentDashboardId) showError('Dashboard no especificado');
    loadChecklists();
});

async function loadChecklists() {
    try {
        showLoader();
        
        const response = await fetch(`https://codegarage.site/api/checklists/dashboard/${currentDashboardId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        handleUnauthorized(response);
        
        const checklists = await response.json();
        renderChecklists(checklists);
        
    } catch (error) {
        showError('Error cargando checklists');
    } finally {
        hideLoader();
    }
}

function renderChecklists(checklists) {
    checklistsContainer.innerHTML = checklists.map(checklist => `
        <div class="checklist-card" data-id="${checklist.id}">
            <div class="checklist-header">
                <h3>${checklist.title}</h3>
                <button onclick="deleteChecklist(${checklist.id})">🗑️</button>
            </div>
            
            ${checklist.description ? `<p>${checklist.description}</p>` : ''}
            
            <div class="tags">
                ${checklist.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            
            <div class="items-container">
                ${checklist.items.map(item => `
                    <div class="item" data-item-id="${item.id}">
                        <label>
                            <input type="checkbox" 
                                   ${item.completed ? 'checked' : ''} 
                                   onchange="toggleItem(${checklist.id}, ${item.id}, this.checked)">
                            <span>${item.description}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
            
            <button class="add-item-btn" onclick="showAddItemForm(${checklist.id})">
                ➕ Añadir Item
            </button>
        </div>
    `).join('');
}

// Helpers
function redirectToLogin() {
    window.location.href = '/login.html';
}

function showError(message) {
    alert(message);
    window.history.back();
}

function showLoader() {
    checklistsContainer.innerHTML = '<div class="loader">Cargando...</div>';
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
}

function handleUnauthorized(response) {
    if (response.status === 401) redirectToLogin();
    if (!response.ok) throw new Error('HTTP error: ' + response.status);
}
// Eliminar checklist
async function deleteChecklist(checklistId) {
    if (!confirm('¿Eliminar esta checklist?')) return;
    
    try {
        const response = await fetch(`/api/checklists/${checklistId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) loadChecklists();
    } catch (error) {
        showError('Error eliminando checklist');
    }
}

// Actualizar estado de item
async function toggleItem(checklistId, itemId, completed) {
    try {
        await fetch(`/api/checklists/${checklistId}/items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });
    } catch (error) {
        showError('Error actualizando item');
    }
}

// Mostrar formulario para nuevo item
function showAddItemForm(checklistId) {
    const form = `
        <div class="item-form">
            <input type="text" id="newItemDesc" placeholder="Descripción">
            <button onclick="addItemToChecklist(${checklistId})">Guardar</button>
        </div>
    `;
    
    const checklistCard = document.querySelector(`[data-id="${checklistId}"]`);
    checklistCard.insertAdjacentHTML('beforeend', form);
}

// Añadir nuevo item
async function addItemToChecklist(checklistId) {
    const description = document.getElementById('newItemDesc').value;
    
    try {
        const response = await fetch(`/api/checklists/${checklistId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description, completed: false })
        });
        
        if (response.ok) loadChecklists();
    } catch (error) {
        showError('Error añadiendo item');
    }
}