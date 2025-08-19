const UploadHistory = ({ uploadHistory, setUploadHistory }) => {
  const clearHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem('uploadHistory');
  };

  const removeItem = (index) => {
    const newHistory = uploadHistory.filter((_, i) => i !== index);
    setUploadHistory(newHistory);
    localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return '📝';
      case 'url': return '🌐';
      case 'file': return '📂';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload History</h3>
        {uploadHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {uploadHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No uploads yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your upload history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploadHistory.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{getTypeIcon(item.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(item.timestamp)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 capitalize">
                      {item.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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
