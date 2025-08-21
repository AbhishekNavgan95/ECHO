import { FileText, Link, File, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const SessionDetailsModal = ({ isOpen, onClose, session, onSessionUpdate }) => {
  if (!session) return null;

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

  const handleFileRemove = async (filename) => {
    if (!window.confirm(`Remove '${filename}' from session?`)) return;
    
    try {
      const resp = await fetch(`${API_BASE}/sessions/${session.sessionId}/file/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await resp.json();
      if (data.ok) {
        // Trigger session update to refresh the data
        if (onSessionUpdate) {
          onSessionUpdate();
        }
      } else {
        alert(data.error || 'Failed to remove file');
      }
    } catch (err) {
      alert('Error removing file');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Session Details: ${session.name}`}>
      <div className="space-y-6">
        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {session.messageCount || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Messages</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {session.totalInputs || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Context Items</div>
          </div>
        </div>

        {/* Recent Messages */}
        {session.messages && session.messages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Messages</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {session.messages.slice(-5).map((message, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {message.sender === 'user' ? 'You' : 'AI'}:
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Context Sources */}
        {session.inputs && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Context Sources</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              
              {/* Text Snippets */}
              {session.inputs.textSnippets && session.inputs.textSnippets.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Text Snippets</h5>
                  <div className="space-y-1">
                    {session.inputs.textSnippets.map((snippet, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        {getInputIcon('text')}
                        <div className="flex-1 text-gray-600 dark:text-gray-400">
                          {snippet.content?.substring(0, 100)}
                          {snippet.content?.length > 100 && '...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URLs */}
              {session.inputs.uploadedUrls && session.inputs.uploadedUrls.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">URLs</h5>
                  <div className="space-y-1">
                    {session.inputs.uploadedUrls.map((urlItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        {getInputIcon('url')}
                        <div className="flex-1 text-gray-600 dark:text-gray-400">
                          <div className="font-medium">{urlItem.title || 'Untitled'}</div>
                          <div className="text-gray-500 dark:text-gray-500 truncate">{urlItem.url}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {session.inputs.uploadedFiles && session.inputs.uploadedFiles.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Files</h5>
                  <div className="space-y-1">
                    {session.inputs.uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        {getInputIcon('file')}
                        <div className="flex-1 text-gray-600 dark:text-gray-400">
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-gray-500 dark:text-gray-500">
                            {file.size ? `${Math.round(file.size / 1024)} KB` : ''}
                          </div>
                        </div>
                        <button
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Remove file from session"
                          onClick={() => handleFileRemove(file.filename)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No context message */}
              {(!session.inputs.textSnippets || session.inputs.textSnippets.length === 0) &&
               (!session.inputs.uploadedUrls || session.inputs.uploadedUrls.length === 0) &&
               (!session.inputs.uploadedFiles || session.inputs.uploadedFiles.length === 0) && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No context added yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SessionDetailsModal;
