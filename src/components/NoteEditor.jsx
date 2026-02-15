import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, FileText, Save, Check, Home } from 'lucide-react';
import { api } from '../services/api';

export default function NoteEditor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const currentNote = notes.find(n => n.id === activeNote);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

   const loadNotes = async () => {
  console.log('=== loadNotes called ===');
  try {
    setIsLoading(true);
    
    // Check if there's a specific note to open from URL
    const noteIdFromUrl = searchParams.get('note');
    console.log('Note ID from URL:', noteIdFromUrl);
    
    if (noteIdFromUrl) {
      // Load the specific note with full content
      const noteData = await api.getNote(noteIdFromUrl);
      console.log('✅ Loaded specific note:', noteData);
      
      const transformedNote = {
        id: noteData.id,
        title: noteData.title,
        content: noteData.content,
        timestamp: new Date(noteData.updated_at || noteData.created_at)
      };
      
      setNotes([transformedNote]);
      setActiveNote(transformedNote.id);
    } else {
      // Load all notes (for the sidebar list)
      const data = await api.getNotes();
      console.log('✅ Loaded notes list:', data);
      
      if (data && data.length > 0) {
        // For the list, we can use previews, but we need to fetch full content for the first note
        const firstNote = await api.getNote(data[0].id);
        
        const transformedNotes = [{
          id: firstNote.id,
          title: firstNote.title,
          content: firstNote.content,
          timestamp: new Date(firstNote.updated_at || firstNote.created_at)
        }];
        
        setNotes(transformedNotes);
        setActiveNote(firstNote.id);
      } else {
        // Create a default note if none exist
        const tempNote = {
          id: 'temp-' + Date.now(),
          title: 'My First Note',
          content: '',
          timestamp: new Date()
        };
        setNotes([tempNote]);
        setActiveNote(tempNote.id);
      }
    }
  } catch (error) {
    console.error('Error loading notes:', error);
    // Fallback to local note
    const defaultNote = {
      id: 'temp-' + Date.now(),
      title: 'My First Note',
      content: '',
      timestamp: new Date()
    };
    setNotes([defaultNote]);
    setActiveNote(defaultNote.id);
  } finally {
    setIsLoading(false);
  }
};

  const saveNote = async () => {
    if (!currentNote) return;
    
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Check if it's a temporary note (not yet saved to backend)
      if (typeof currentNote.id === 'string' && currentNote.id.startsWith('temp-')) {
        // Create new note
        const response = await api.createNote({
          title: currentNote.title,
          content: currentNote.content
        });
        
        // Update local state with real ID
        setNotes(notes.map(n => 
          n.id === currentNote.id 
            ? { ...n, id: response.id, timestamp: new Date(response.created_at) }
            : n
        ));
        setActiveNote(response.id);
      } else {
        // Update existing note
        await api.updateNote(currentNote.id, {
          title: currentNote.title,
          content: currentNote.content
        });
      }
      
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (saveStatus === 'unsaved' && currentNote) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
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

  const addNote = async () => {
  const tempNote = {
    id: 'temp-' + Date.now(),
    title: `Note ${notes.length + 1}`,
    content: '', // Empty content is fine for local temp notes
    timestamp: new Date()
  };
  setNotes([...notes, tempNote]);
  setActiveNote(tempNote.id);
  setSaveStatus('unsaved');
  // Don't try to save empty notes to the backend!
};

  const deleteNote = async (id) => {
    if (notes.length === 1) return;
    
    try {
      // Only delete from backend if it's not a temp note
      if (typeof id === 'string' && !id.startsWith('temp-')) {
        await api.deleteNote(id);
      }
      
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      if (activeNote === id) {
        setActiveNote(filtered[0].id);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentNote?.content]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-neutral-900 items-center justify-center">
        <div className="text-amber-400">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-neutral-900">
      {/* Sidebar */}
      <div className="w-72 bg-black/40 backdrop-blur-sm border-r border-stone-700/50 flex flex-col">
        <div className="p-6 border-b border-stone-700/50">
          <h1 className="text-2xl font-semibold text-amber-100 mb-1">Notes</h1>
          <div className="flex items-center gap-2 text-amber-400 cursor-pointer hover:text-amber-300 transition-colors" onClick={handleHomeClick}>
            <Home className="w-4 h-4" />
            Home
          </div>
          <p className="text-sm text-stone-400 mt-2">Your personal notebook</p>
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

          <div 
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: '96px',
              width: '2px',
              background: 'linear-gradient(to bottom, transparent, #dc2626 20%, #dc2626 80%, transparent)',
              opacity: 0.2
            }}
          />

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