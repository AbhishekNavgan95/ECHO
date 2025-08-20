import { useEffect, useState } from 'react';
import FileUpload from './FileUpload.jsx';
import UploadHistory from './UploadHistory.jsx';

const KnowledgeBase = ({
  activeTab,
  setActiveTab,
  text,
  setText,
  url,
  setUrl,
  file,
  setFile,
  filePreview,
  setFilePreview,
  uploadHistory,
  setUploadHistory,
  ingesting,
  uploadProgress,
  ingestAll,
  showSmartSuggestion,
  setShowSmartSuggestion,
  handleTextSplit
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className='flex items-center gap-x-2'>
                <h2 className="text-xl font-semibold">Knowledge Base</h2>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    ℹ️
                  </button>
                  {showTooltip && (
                    <div className="absolute right-0 top-8 w-64 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                      Upload documents, paste text, or add URLs to build your knowledge base. The AI will use this information to provide more accurate responses.
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload content to enhance AI responses</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => {
                  setActiveTab('upload')
                  setUrl("")
                  setText("")
                  setFilePreview(null)
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upload'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                Upload
              </button>
              <button
                onClick={() => {
                  setActiveTab('history')
                  setUrl("")
                  setText("")
                  setFilePreview(null)
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all relative ${activeTab === 'history'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                History
                {uploadHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {uploadHistory.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'upload' ? (
          <FileUpload
            text={text}
            setText={setText}
            url={url}
            setUrl={setUrl}
            file={file}
            setFile={setFile}
            filePreview={filePreview}
            setFilePreview={setFilePreview}
            ingesting={ingesting}
            uploadProgress={uploadProgress}
            ingestAll={ingestAll}
            showSmartSuggestion={showSmartSuggestion}
            setShowSmartSuggestion={setShowSmartSuggestion}
            handleTextSplit={handleTextSplit}
          />
        ) : (
          <UploadHistory
            uploadHistory={uploadHistory}
            setUploadHistory={setUploadHistory}
            setText={setText}
            setUrl={setUrl}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </section>
  );
};

export default KnowledgeBase;
