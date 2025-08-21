import { useState } from 'react';
import { Plus, FileText, Link, Upload, Info, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const SessionInput = ({ currentSession, onInputAdded }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddText = async () => {
    if (!textContent.trim() || !currentSession) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions/${currentSession.sessionId}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: textContent.trim() })
      });
      const data = await response.json();
      if (data.ok) {
        setTextContent('');
        onInputAdded(data.session);
      }
    } catch (error) {
      console.error('Error adding text:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlContent.trim() || !currentSession) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions/${currentSession.sessionId}/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ url: urlContent.trim() })
      });
      const data = await response.json();
      if (data.ok) {
        setUrlContent('');
        onInputAdded(data.session);
      }
    } catch (error) {
      console.error('Error adding URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile || !currentSession) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch(`${API_BASE}/sessions/${currentSession.sessionId}/file`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      if (data.ok) {
        setFile(null);
        event.target.value = ''; // Reset file input
        onInputAdded(data.session);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select or create a session to add context</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Add Context to Session
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enhance your AI conversations by adding relevant context to "{currentSession.name}"
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-1.5">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'text'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Text</span>
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'url'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
          }`}
        >
          <Link className="h-4 w-4" />
          <span>URL</span>
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>File</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Text Context</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Add any text content like notes, research, or information that will help the AI understand your topic better.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Content
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Example: Key findings from my research on renewable energy trends in 2024...\n\n• Solar panel efficiency increased by 15%\n• Wind energy costs dropped 8%\n• Battery storage capacity doubled"
              className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: Be specific and organized. Use bullet points or numbered lists for better AI understanding.
            </p>
          </div>
          <button
            onClick={handleAddText}
            disabled={!textContent.trim() || loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Adding Text...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Add Text Context</span>
              </>
            )}
          </button>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">URL Context</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Add web pages, articles, or documentation. We'll automatically extract and process the content for you.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website URL
            </label>
            <input
              type="url"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com/article-about-your-topic"
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Supported sources:</strong>
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>• News articles and blog posts</li>
                <li>• Documentation and guides</li>
                <li>• Research papers and reports</li>
                <li>• Wikipedia and educational content</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleAddUrl}
            disabled={!urlContent.trim() || loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing URL...</span>
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                <span>Add URL Context</span>
              </>
            )}
          </button>
        </div>
      )}

      {activeTab === 'file' && (
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">File Context</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Upload documents to extract their content. Perfect for PDFs, Word docs, and text files.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Document Upload
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors duration-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.txt,.md, .docx"
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block"
              >
                <span className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 inline-block">
                  Choose File to Upload
                </span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4">
                Drag and drop or click to select a file
              </p>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supported formats:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>PDF documents</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>CSV files (.csv)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Text files (.txt)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Markdown (.md)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Maximum file size: 10MB</p>
              </div>
            </div>
            {loading && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Processing your file...</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Extracting content and adding to session context</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionInput;
