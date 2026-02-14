import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, FileText, Save, Check } from 'lucide-react';

export default function NoteEditor() {
  const [notes, setNotes] = useState([
    { id: 1, title: 'My First Note', content: '', timestamp: new Date() }
  ]);
  const [activeNote, setActiveNote] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving', 'error'
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const currentNote = notes.find(n => n.id === activeNote);

  // Auto-save functionality
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout to save after 2 seconds of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes, saveStatus]);

  const saveNote = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const data = await response.json();
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: `Note ${notes.length + 1}`,
      content: '',
      timestamp: new Date()
    };
    setNotes([...notes, newNote]);
    setActiveNote(newNote.id);
    setSaveStatus('unsaved');
  };

  const deleteNote = async (id) => {
    if (notes.length === 1) return;
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    if (activeNote === id) {
      setActiveNote(filtered[0].id);
    }
    setSaveStatus('unsaved');
    
    // Also send delete request to backend
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const updateNote = (content) => {
    setNotes(notes.map(n => 
      n.id === activeNote 
        ? { ...n, content, timestamp: new Date() }
        : n
    ));
    setSaveStatus('unsaved');
  };

  const updateTitle = (title) => {
    setNotes(notes.map(n => 
      n.id === activeNote 
        ? { ...n, title }
        : n
    ));
    setSaveStatus('unsaved');
  };

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (response.ok) {
          const data = await response.json();
          if (data.notes && data.notes.length > 0) {
            setNotes(data.notes.map(note => ({
              ...note,
              timestamp: new Date(note.timestamp)
            })));
            setActiveNote(data.notes[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentNote?.content]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-neutral-900">
      {/* Sidebar */}
      <div className="w-72 bg-black/40 backdrop-blur-sm border-r border-stone-700/50 flex flex-col">
        <div className="p-6 border-b border-stone-700/50">
          <h1 className="text-2xl font-semibold text-amber-100 mb-1">Notes</h1>
          <p className="text-sm text-stone-400">Your personal notebook</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                activeNote === note.id
                  ? 'bg-amber-900/30 border border-amber-700/50'
                  : 'bg-stone-800/30 border border-stone-700/30 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="w-4 h-4 text-amber-600/70" />
                  <h3 className="text-sm font-medium text-amber-50 truncate">
                    {note.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-900/30 rounded"
                  disabled={notes.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400/70" />
                </button>
              </div>
              <p className="text-xs text-stone-400 truncate">
                {note.content || 'Empty note'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {note.timestamp.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-stone-700/50">
          <button
            onClick={addNote}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 rounded-lg transition-all duration-200 border border-amber-700/30"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-12 py-6 border-b border-stone-700/30 bg-black/20 flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={currentNote?.title || ''}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-3xl font-medium bg-transparent border-none outline-none text-amber-50 placeholder-stone-500 w-full"
              placeholder="Untitled Note"
            />
            <p className="text-sm text-stone-400 mt-2">
              Last edited {currentNote?.timestamp.toLocaleString()}
            </p>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-2 text-sm text-green-400">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-2 text-sm text-amber-400">
                <Save className="w-4 h-4 animate-pulse" />
                Saving...
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-sm text-stone-400">
                Unsaved changes
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-400">
                Save failed
              </span>
            )}
            <button
              onClick={saveNote}
              disabled={isSaving || saveStatus === 'saved'}
              className="flex items-center gap-2 px-4 py-2 bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 rounded-lg transition-all duration-200 border border-amber-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* College Ruled Paper Background */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Notebook Lines Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to bottom, transparent 0px, transparent 31px, #6b5744 31px, #6b5744 32px),
                linear-gradient(to right, #8b4513 0px, #8b4513 2px, transparent 2px)
              `,
              backgroundSize: '100% 32px, 80px 100%',
              backgroundPosition: '0 0, 96px 0',
              opacity: 0.15
            }}
          />

          {/* Red Margin Line */}
          <div 
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: '96px',
              width: '2px',
              background: 'linear-gradient(to bottom, transparent, #dc2626 20%, #dc2626 80%, transparent)',
              opacity: 0.2
            }}
          />

          {/* Text Area */}
          <div className="relative px-12 py-8">
            <textarea
              ref={textareaRef}
              value={currentNote?.content || ''}
              onChange={(e) => updateNote(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-amber-50 placeholder-stone-500 font-mono leading-8 min-h-screen"
              style={{
                paddingLeft: '84px',
                lineHeight: '32px',
                fontSize: '16px'
              }}
              placeholder="Start writing..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}