import { useMemo, useState } from 'react';
import { FileText, Link, File, Trash2, Copy, Play, Search, ArrowUpDown } from 'lucide-react';

const UploadHistory = ({ uploadHistory, setUploadHistory, setText, setUrl, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | text | url | file
  const [sortOrder, setSortOrder] = useState('desc'); // desc=newest first, asc=oldest first

  const clearHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem('uploadHistory');
  };

  const removeItem = (index) => {
    const newHistory = uploadHistory.filter((_, i) => i !== index);
    setUploadHistory(newHistory);
    localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
  };

  const useItem = (item) => {
    if (item.type === 'text') setText(item.content);
    else if (item.type === 'url') setUrl(item.content);
    setActiveTab('upload');
  };

  const copyItem = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content || item.name || '');
    } catch (e) {}
  };

  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4 text-blue-500"/>;
      case 'url': return <Link className="w-4 h-4 text-green-500"/>;
      case 'file': return <File className="w-4 h-4 text-purple-500"/>;
      default: return <File className="w-4 h-4 text-gray-400"/>;
    }
  };

  const filtered = useMemo(() => {
    let list = [...uploadHistory];
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.content && String(i.content).toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return list;
  }, [uploadHistory, query, typeFilter, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload History</h3>
        {uploadHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4"/> Clear All
          </button>
        )}
      </div>

      {uploadHistory.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or content…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 items-center">
            {['all','text','url','file'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-all border ${
                  typeFilter === type
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                {type}
              </button>
            ))}

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-400"
              title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
            >
              <ArrowUpDown className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {uploadHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400"/>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No uploads yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your upload history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          {filtered.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all duration-200 flex justify-between items-center">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(item.timestamp)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(item.type === 'text' || item.type === 'url') && (
                  <>
                    <button
                      onClick={() => useItem(item)}
                      className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title="Use"
                    >
                      <Play className="w-4 h-4"/>
                    </button>
                    <button
                      onClick={() => copyItem(item)}
                      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4"/>
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeItem(index)}
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadHistory;
