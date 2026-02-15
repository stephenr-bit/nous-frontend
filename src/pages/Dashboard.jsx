import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Network, Brain, Link2, Clock, TrendingUp, FileText, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalConnections: 0,
    totalTopics: 0,
    graphDensity: 0
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load notes
      const notesData = await api.getNotes();
      
      console.log('Loaded notes:', notesData);
      
      // Transform notes for display
      const notes = notesData || [];
      console.log('Transformed notes:', notes);
      const transformedNotes = notes.slice(0, 4).map(note => ({
        id: note.id,
        title: note.title,
        tags: note.metadata?.tags || [],
        connections: 0, // We'll update this when we have graph data
        timestamp: new Date(note.updated_at || note.created_at),
        preview: note.preview
      }));
      console.log('Transformed recent notes:', transformedNotes);

      
      setRecentNotes(transformedNotes);
      
      // Update stats
      setStats({
        totalNotes: notes.length,
        totalConnections: 0, // Will be updated when we fetch graph data
        totalTopics: 0, // Will be calculated from tags
        graphDensity: 0 // Will be calculated from connections
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const results = await api.searchNotes(searchQuery);
      console.log('Search results:', results);
      // TODO: Display search results in UI
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleNoteClick = (noteId) => {
    navigate(`/editor?note=${noteId}`);
  };

  const handleNewNote = () => {
    navigate('/editor');
  };

  const handleViewGraph = () => {
    // TODO: navigate('/graph');
    console.log('Opening graph');
  };

  const handleTagClick = (tag) => {
    setSearchQuery(`#${tag}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-neutral-900 items-center justify-center">
        <div className="text-amber-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-neutral-900">
      {/* Sidebar */}
      <div className="w-80 bg-black/40 backdrop-blur-sm border-r border-stone-700/50 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-700/50">
          <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/50">
              <Brain size={22} className="text-amber-50" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-amber-100">Nous</h1>
              <p className="text-xs text-stone-400 tracking-wider">YOUR EXTENDED MIND</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-700/50">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search your knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-sm text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-all"
              />
            </div>
          </form>
        </div>

        {/* Recent Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Recent Notes</h3>
          {recentNotes.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm">
              No notes yet. Create your first note!
            </div>
          ) : (
            recentNotes.map(note => (
              <div
                key={note.id}
                onClick={() => handleNoteClick(note.id)}
                className="group p-3 rounded-lg cursor-pointer transition-all duration-200 bg-stone-800/30 border border-stone-700/30 hover:bg-amber-900/20 hover:border-amber-700/50"
              >
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="w-4 h-4 text-amber-600/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-amber-50 truncate">
                      {note.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-stone-400 line-clamp-2 mb-2">
                  {note.preview}
                </p>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{formatTimestamp(note.timestamp)}</span>
                  </div>
                </div>
                {note.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-xs px-1.5 py-0.5 bg-amber-900/20 text-amber-400 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagClick(tag);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-stone-700/50 space-y-2">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 rounded-lg transition-all duration-200 border border-amber-700/30 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={handleViewGraph}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800/40 hover:bg-stone-800/60 text-stone-300 rounded-lg transition-all duration-200 border border-stone-700/30 text-sm"
          >
            <Network className="w-4 h-4" />
            Knowledge Graph
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-12 py-8 border-b border-stone-700/30 bg-black/20">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold text-amber-50 mb-2">Welcome to Nous</h1>
            <p className="text-stone-400">Your personal knowledge management system</p>
          </div>
        </div>

        {/* Main Content with Paper Background */}
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
              backgroundPosition: '0 0, 120px 0',
              opacity: 0.1
            }}
          />

          {/* Red Margin Line */}
          <div 
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: '120px',
              width: '2px',
              background: 'linear-gradient(to bottom, transparent, #dc2626 10%, #dc2626 90%, transparent)',
              opacity: 0.15
            }}
          />

          {/* Content */}
          <div className="relative px-12 py-8" style={{ paddingLeft: '140px' }}>
            <div className="max-w-4xl">
              {/* Knowledge Graph Section */}
              <div className="mb-8 p-6 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-semibold text-amber-100">Knowledge Graph</h2>
                  </div>
                  <button
                    onClick={handleViewGraph}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Explore →
                  </button>
                </div>
                <div className="h-64 bg-stone-900/50 rounded-lg border border-stone-700/30 flex items-center justify-center">
                  <div className="text-center">
                    <Network className="w-16 h-16 text-amber-600/40 mx-auto mb-3" />
                    <p className="text-stone-400 text-sm">Your knowledge network is growing...</p>
                    <p className="text-stone-500 text-xs mt-1">Connections form as you write</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-500 mb-1">{stats.totalNotes}</div>
                  <div className="text-xs text-stone-400 uppercase tracking-wider">Notes</div>
                </div>
                <div className="p-4 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-500 mb-1">{stats.totalConnections}</div>
                  <div className="text-xs text-stone-400 uppercase tracking-wider">Connections</div>
                </div>
                <div className="p-4 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-500 mb-1">{stats.totalTopics}</div>
                  <div className="text-xs text-stone-400 uppercase tracking-wider">Topics</div>
                </div>
                <div className="p-4 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-500 mb-1">{stats.graphDensity}%</div>
                  <div className="text-xs text-stone-400 uppercase tracking-wider">Density</div>
                </div>
              </div>

              {/* Getting Started Guide */}
              <div className="p-6 bg-black/20 backdrop-blur-sm border border-stone-700/30 rounded-lg">
                <h2 className="text-xl font-semibold text-amber-100 mb-4">Getting Started</h2>
                <div className="space-y-3 text-stone-300">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0 text-xs text-amber-400 font-semibold">1</div>
                    <div>
                      <p className="font-medium text-amber-100">Create your first note</p>
                      <p className="text-sm text-stone-400">Click "New Note" to start capturing your thoughts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0 text-xs text-amber-400 font-semibold">2</div>
                    <div>
                      <p className="font-medium text-amber-100">Add tags and connections</p>
                      <p className="text-sm text-stone-400">Organize notes with tags - AI will find connections automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0 text-xs text-amber-400 font-semibold">3</div>
                    <div>
                      <p className="font-medium text-amber-100">Explore your knowledge graph</p>
                      <p className="text-sm text-stone-400">Visualize how your ideas connect and discover patterns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}