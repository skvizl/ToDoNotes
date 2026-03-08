document.addEventListener('DOMContentLoaded', () => {
    const notesGrid = document.getElementById('notes-grid');
    const sortSelect = document.getElementById('sort-select');
    const addNoteBtn = document.getElementById('add-note-btn');
    const noteModal = document.getElementById('note-modal');
    const noteForm = document.getElementById('note-form');
    const modalTitle = document.getElementById('modal-title');
    const noteTitleInput = document.getElementById('note-title');
    const noteTextInput = document.getElementById('note-text');
    const cancelBtn = document.getElementById('cancel-btn');
    const charCountSpan = document.getElementById('char-count');

    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let editingId = null;

    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function renderNotes() {
        notesGrid.innerHTML = '';
        const sortOrder = sortSelect.value;
        const sortedNotes = [...notes].sort((a, b) => {
            if (sortOrder === 'newest') return b.updatedAt - a.updatedAt;
            return a.updatedAt - b.updatedAt;
        });

        if (sortedNotes.length === 0) {
            notesGrid.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1; padding: 3rem;">No notes yet. Click "+ New Note" to add one!</p>';
            return;
        }

        sortedNotes.forEach(note => {
            const dateStr = buildDateString(note.updatedAt);

            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${escapeHTML(note.title)}</div>
                </div>
                <div class="note-date">${dateStr}</div>
                <div class="note-content">${escapeHTML(note.content).replace(/\n/g, '<br>')}</div>
                <div class="note-actions">
                    <button class="icon-btn edit-btn" data-id="${note.id}" title="Edit">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn delete delete-btn" data-id="${note.id}" title="Delete">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            notesGrid.appendChild(card);
        });

        // Add event listeners to newly created buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteNote(e.currentTarget.dataset.id));
        });
    }

    function buildDateString(timestamp) {
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
    }

    function openModal(id = null) {
        editingId = id;
        if (id) {
            const note = notes.find(n => n.id === id);
            if (note) {
                modalTitle.textContent = 'Edit Note';
                noteTitleInput.value = note.title;
                noteTextInput.value = note.content;
            }
        } else {
            modalTitle.textContent = 'Add Note';
            noteTitleInput.value = '';
            noteTextInput.value = '';
        }
        updateCharCount();
        noteModal.classList.add('visible');
    }

    function closeModal() {
        noteModal.classList.remove('visible');
        editingId = null;
    }

    function deleteNote(id) {
        if (confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
        }
    }

    function updateCharCount() {
        const count = noteTextInput.value.length;
        charCountSpan.textContent = count;
        if (count > 1000) {
            charCountSpan.style.color = 'var(--danger)';
        } else {
            charCountSpan.style.color = 'var(--text-muted)';
        }
    }

    // Event Listeners
    addNoteBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    sortSelect.addEventListener('change', renderNotes);

    noteTextInput.addEventListener('input', updateCharCount);

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = noteTitleInput.value.trim();
        const content = noteTextInput.value;

        if (content.length > 1000) {
            alert('Note content text exceeds 1000 characters limit.');
            return;
        }

        const now = Date.now();

        if (editingId) {
            const index = notes.findIndex(n => n.id === editingId);
            if (index !== -1) {
                // Editing sets updatedAt to now, and keeps createdAt
                notes[index] = { ...notes[index], title, content, updatedAt: now };
            }
        } else {
            const newNote = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2), // robust ID without crypto
                title: title || 'Untitled',
                content,
                createdAt: now,
                updatedAt: now
            };
            notes.push(newNote);
        }

        saveNotes();
        closeModal();
        renderNotes();
    });

    // Close modal on background click
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) {
            closeModal();
        }
    });

    // Initial render
    renderNotes();
});
