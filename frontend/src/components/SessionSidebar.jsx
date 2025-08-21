import { useState, useEffect } from 'react';
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
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Sign in to view your sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sessions</h2>
          <div className="flex gap-2">
            <button
              onClick={handleNewSession}
              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="New Session"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create sessions to organize your conversations and context
        </p>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`rounded-lg border transition-colors ${currentSession?.sessionId === session.sessionId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {/* Session Header */}
                <div className="p-3">
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
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{session.messageCount || 0} messages</span>
                            <span>•</span>
                            <span>{session.totalInputs || 0} inputs</span>
                            <span>•</span>
                            <span>{formatDate(session.lastActivityAt)}</span>
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

      {/* Session Details Modal */}
      <SessionDetailsModal
        isOpen={!!selectedSessionForDetails}
        onClose={handleCloseDetails}
        session={selectedSessionForDetails}
        onSessionUpdate={handleSessionDetailsUpdate}
      />
    </div>
  );
};

export default SessionSidebar;
