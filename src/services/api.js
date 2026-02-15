const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Notes
  async getNotes() {
    const response = await fetch(`${API_URL}/api/notes`);
    return response.json();
  },

    async getNote(id) {
  const response = await fetch(`${API_URL}/api/notes/${id}`);
  if (!response.ok) throw new Error('Failed to fetch note');
  const data = await response.json();
  return data.note; // Extract just the note from the response
},
  async createNote(noteData) {
    const response = await fetch(`${API_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: noteData.title,
            content: noteData.content,
            metadata: noteData.metadata || {},

      })
    });
    if (!response.ok) {
    const error = await response.json();
    console.error('Create note error:', error);
    throw new Error('Failed to create note');
  }
    return response.json();
  },

  async updateNote(id, noteData) {
    const response = await fetch(`${API_URL}/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    return response.json();
  },

  async deleteNote(id) {
    const response = await fetch(`${API_URL}/api/notes/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Graph
  async getGraph() {
    const response = await fetch(`${API_URL}/api/graph`);
    return response.json();
  },

  // Search
  async searchNotes(query) {
    const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },
};