import { useState, useEffect } from 'react';
import './SessionSidebar.css';
import { Plus, MessageSquare, FileText, Link, File, Edit2, Trash2, Info } from 'lucide-react';
import SessionDetailsModal from './SessionDetailsModal.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const SessionSidebar = ({ user, currentSession, onSessionSelect, onNewSession, onSessionUpdate, onSessionDelete, onAddContext, refreshTrigger }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);

  // Fetch sessions on mount and when user changes or refresh is triggered
  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
    }
  }, [user, refreshTrigger]);

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `Session ${new Date().toLocaleDateString()}`
        })
      });
      const data = await response.json();
      if (data.ok) {
        setSessions(prev => [data.session, ...prev]);
        onNewSession(data.session);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSessionRename = async (sessionId, newName) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await response.json();
      if (data.ok) {
        setSessions(prev => prev.map(s =>
          s.sessionId === sessionId ? { ...s, name: newName.trim() } : s
        ));
        onSessionUpdate(data.session);
        setEditingSession(null);
        setEditName('');
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const handleSessionDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.ok) {
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        onSessionDelete(sessionId);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleShowDetails = (session) => {
    setSelectedSessionForDetails(session);
  };

  const handleCloseDetails = () => {
    setSelectedSessionForDetails(null);
  };

  const handleSessionDetailsUpdate = () => {
    // Refresh sessions when details are updated (e.g., file removed)
    fetchSessions();
  };

  const startEditing = (session) => {
    setEditingSession(session.sessionId);
    setEditName(session.name);
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setEditName('');
  };

  const getInputIcon = (type) => {
    switch (type) {
      case 'text':
        return <FileText className="h-3 w-3" />;
      case 'url':
        return <Link className="h-3 w-3" />;
      case 'file':
        return <File className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-xl border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col h-full transition-all duration-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg font-medium mb-2">Welcome to ECHO AI</p>
            <p className="text-sm opacity-75">Sign in to view your sessions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-xl flex flex-col h-full border-r border-gray-100 dark:border-gray-800 transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Sessions</h2>
          <button
            onClick={handleNewSession}
            disabled={loading}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="New Session"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-6 pt-2 pb-4 italic">
          Organize your conversations and context in separate sessions.
        </p>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs mt-1">Create your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`group rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer ${currentSession?.sessionId === session.sessionId
                    ? 'bg-gradient-to-r from-blue-100/80 via-blue-50/80 to-blue-200/60 dark:from-blue-900/40 dark:via-blue-900/20 dark:to-blue-800/10 border-blue-400 dark:border-blue-700'
                    : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-400'
                    }`}
                >
                  {/* Session Header */}
                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {editingSession === session.sessionId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSessionRename(session.sessionId, editName);
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              className="flex-1 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSessionRename(session.sessionId, editName)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onSessionSelect(session)}
                            className="text-left w-full"
                          >
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {session.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs mt-2 text-gray-500 dark:text-gray-400">
                              <span className="bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-0.5">{session.messageCount || 0} msgs</span>
                              <span className="bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-0.5">{session.totalInputs || 0} ctx</span>
                              <span className="italic">{formatDate(session.lastActivityAt)}</span>
                            </div>
                          </button>
                        )}
                      </div>

                      {editingSession !== session.sessionId && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetails(session);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                            title="View session details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(session);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionDelete(session.sessionId);
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SessionDetailsModal
        isOpen={!!selectedSessionForDetails}
        onClose={handleCloseDetails}
        session={selectedSessionForDetails}
        onSessionUpdate={handleSessionDetailsUpdate}
      />
    </>
  );
};

export default SessionSidebar;
