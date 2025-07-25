// API Configuration
const API_BASE = '/notes';
let allNotes = [];
let editingNoteId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    applySavedTheme(); // Apply theme on load
});

async function initializeApp() {
    showLoading();
    try {
        await fetchNotes();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load notes. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// API Functions
async function fetchNotes() {
    console.log('Fetching notes from API...');
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            console.error('API fetch error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const notes = await response.json();
        console.log('Notes fetched successfully:', notes);
        allNotes = notes.map(note => ({
            ...note,
            // Ensure timestamp exists, or generate a default one
            timestamp: note.timestamp || formatTimestamp(new Date())
        }));
        renderNotes(allNotes);
        return allNotes;
    } catch (error) {
        console.error('Error fetching notes:', error);
        // Fallback to demo data if API fails
        allNotes = getDemoNotes();
        renderNotes(allNotes);
        showToast('Using demo data. API connection failed.', 'warning');
        return allNotes;
    }
}

async function createNoteAPI(content) {
    console.log('Attempting to create note with content:', content);
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const errorData = await response.text(); // Get raw error response
            console.error('API create error:', response.status, response.statusText, errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }
        
        const newNote = await response.json();
        console.log('Note created successfully via API:', newNote);
        return newNote; // Return the note from the API
    } catch (error) {
        console.error('Error in createNoteAPI:', error);
        throw error; // Re-throw to be caught by createNote
    }
}

async function updateNoteAPI(id, content) {
    console.log('Attempting to update note ID:', id, 'with content:', content);
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const errorData = await response.text(); // Get raw error response
            console.error('API update error:', response.status, response.statusText, errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }
        
        const updatedNote = await response.json();
        console.log('Note updated successfully via API:', updatedNote);
        return updatedNote; // Return the updated note from the API
    } catch (error) {
        console.error('Error in updateNoteAPI:', error);
        throw error; // Re-throw to be caught by updateNote
    }
}

async function deleteNoteAPI(id) {
    console.log('Attempting to delete note ID:', id);
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.text(); // Get raw error response
            console.error('API delete error:', response.status, response.statusText, errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }
        
        console.log('Note deleted successfully via API.');
        return true;
    } catch (error) {
        console.error('Error in deleteNoteAPI:', error);
        throw error; // Re-throw to be caught by deleteNote
    }
}

// Demo data fallback (simplified)
function getDemoNotes() {
    console.log('Using demo notes as API failed or is unavailable.');
    return [
        {
            id: 1,
            content: "This is a sample note. You can edit or delete it.",
            timestamp: "10:30 AM, Monday"
        },
        {
            id: 2,
            content: "Another example note to show functionality.",
            timestamp: "09:15 AM, Monday"
        }
    ];
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab switching (still present in HTML, but no functional difference for now)
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const parentTabs = this.parentElement.querySelectorAll('.tab');
            parentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Modal close events
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('addNoteModal');
        if (event.target === modal) {
            closeAddNoteModal();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAddNoteModal();
        }
    });

    // Theme Toggle Event Listener
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// Render Functions
function renderNotes(notes) {
    console.log('Rendering notes:', notes);
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.appendChild(createEmptyState());
    } else {
        notes.forEach(note => {
            const noteCard = createNoteCard(note);
            container.appendChild(noteCard);
        });
    }

    // Add "New Note" card
    const newNoteCard = createNewNoteCard();
    container.appendChild(newNoteCard);
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = `note-card`; 
    
    card.innerHTML = `
        <div class="note-header">
            <div class="note-title">${escapeHtml(note.content.substring(0, Math.min(note.content.length, 50)))}...</div>
            <div class="note-actions">
                <button onclick="editNote(${note.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNote(${note.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-content">${escapeHtml(note.content)}</div>
        <div class="note-footer">
            <span class="timestamp">${escapeHtml(note.timestamp)}</span>
        </div>
    `;
    
    return card;
}

function createNewNoteCard() {
    const newNoteCard = document.createElement('div');
    newNoteCard.className = 'note-card new-note';
    newNoteCard.innerHTML = `
        <div class="new-note-content" onclick="showAddNoteModal()">
            <i class="fas fa-plus"></i>
            <span>New Note</span>
        </div>
    `;
    return newNoteCard;
}

function createEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <i class="fas fa-sticky-note"></i>
        <h3>No notes yet</h3>
        <p>Create your first note to get started</p>
    `;
    return emptyState;
}

// Modal Functions
function showAddNoteModal() {
    resetModal();
    const modal = document.getElementById('addNoteModal');
    modal.classList.add('show');
    document.getElementById('noteContent').focus();
}

function closeAddNoteModal() {
    const modal = document.getElementById('addNoteModal');
    modal.classList.remove('show');
    resetModal();
}

function resetModal() {
    document.getElementById('noteContent').value = '';
    
    // Reset modal state
    editingNoteId = null;
    document.getElementById('modalTitle').textContent = 'Add New Note';
    document.querySelector('#submitBtn .btn-text').textContent = 'Add Note';
    
    // Reset button state
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    document.querySelector('#submitBtn .btn-text').style.display = 'inline';
    document.querySelector('#submitBtn .btn-spinner').style.display = 'none';
}

// Note Operations
async function handleNoteSubmit(event) {
    event.preventDefault();
    
    const content = document.getElementById('noteContent').value.trim();
    
    if (content.length === 0) {
        showToast('Note content cannot be empty', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    document.querySelector('#submitBtn .btn-text').style.display = 'none';
    document.querySelector('#submitBtn .btn-spinner').style.display = 'inline';
    
    try {
        if (editingNoteId) {
            await updateNote(editingNoteId, content);
        } else {
            await createNote(content);
        }
        
        closeAddNoteModal();
    } catch (error) {
        console.error('Error submitting note (caught in handleNoteSubmit):', error);
        showToast('An unexpected error occurred while saving the note.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        document.querySelector('#submitBtn .btn-text').style.display = 'inline';
        document.querySelector('#submitBtn .btn-spinner').style.display = 'none';
    }
}

async function createNote(content) {
    try {
        await createNoteAPI(content); // Just call the API
        await fetchNotes(); // Re-fetch all notes after successful creation
        showToast('Note created successfully!', 'success');
    } catch (error) {
        console.error('Error in createNote:', error);
        showToast('Failed to create note.', 'error'); // Show error toast if API call fails
    }
}

async function updateNote(id, content) {
    try {
        await updateNoteAPI(id, content); // Just call the API
        await fetchNotes(); // Re-fetch all notes after successful update
        showToast('Note updated successfully!', 'success');
    } catch (error) {
        console.error('Error in updateNote:', error);
        showToast('Failed to update note.', 'error'); // Show error toast if API call fails
    }
}

function editNote(id) {
    const note = allNotes.find(n => n.id == id);
    if (!note) {
        showToast('Note not found for editing.', 'error');
        return;
    }
    
    // Pre-fill the modal with existing note data
    document.getElementById('noteContent').value = note.content || '';
    
    // Set modal to edit mode
    editingNoteId = id;
    document.getElementById('modalTitle').textContent = 'Edit Note';
    document.querySelector('#submitBtn .btn-text').textContent = 'Update Note';
    
    showAddNoteModal();
}

async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        await deleteNoteAPI(id); // Just call the API
        await fetchNotes(); // Re-fetch all notes after successful deletion
        showToast('Note deleted successfully!', 'success');
    } catch (error) {
        console.error('Error in deleteNote:', error);
        showToast('Failed to delete note. Please try again.', 'error'); // Show error toast if API call fails
    }
}

// Search Function
function filterNotes() {
    const searchTerm = document.getElementById('headerSearch').value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        (note.content && note.content.toLowerCase().includes(searchTerm))
    );
    renderNotes(filteredNotes);
}

// Utility Functions
function formatTimestamp(date) {
    return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'long'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Theme Toggle Functions
function toggleTheme() {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save preference
    updateThemeIcon(newTheme);
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection caught:', event.reason);
    showToast('An unexpected error occurred', 'error');
});