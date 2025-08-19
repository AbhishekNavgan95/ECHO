import { useState } from 'react';

const FileUpload = ({ 
  text, 
  setText, 
  url, 
  setUrl, 
  file, 
  setFile, 
  filePreview, 
  setFilePreview, 
  ingesting, 
  uploadProgress, 
  ingestAll,
  showSmartSuggestion,
  setShowSmartSuggestion,
  handleTextSplit
}) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <form onSubmit={e => { e.persist?.(); ingestAll(e) }} className="space-y-4">
      {/* Text Content Card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Content
            </label>
          </div>
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('')
                setShowSmartSuggestion(false)
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ❌
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (e.target.value.length > 100 && !showSmartSuggestion) {
              setShowSmartSuggestion(true)
            }
          }}
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Paste or type your notes here…"
        />
        {showSmartSuggestion && text.length > 100 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              💡 Would you like to split this into sections automatically?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTextSplit}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
              >
                Yes, split it
              </button>
              <button
                type="button"
                onClick={() => setShowSmartSuggestion(false)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                No, thanks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
        </div>
      </div>

      {/* Website URL Card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Website URL
            </label>
          </div>
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ❌
            </button>
          )}
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Enter a website link…"
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
        </div>
      </div>

      {/* File Upload Card */}
      <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border-2 border-dashed transition-all duration-200 group cursor-pointer ${dragOver
        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0) {
            setFile(files[0])
            const fileType = files[0].name.split('.').pop().toLowerCase()
            const fileSize = (files[0].size / 1024 / 1024).toFixed(2) + ' MB'
            setFilePreview({
              name: files[0].name,
              size: fileSize,
              type: fileType === 'pdf' ? 'pdf' :
                fileType === 'docx' ? 'doc' :
                  fileType === 'txt' ? 'txt' :
                    fileType === 'csv' ? 'csv' : 'file'
            })
          }
        }}
        onClick={() => document.getElementById('file-input')?.click()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload File
            </label>
          </div>
          {filePreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFilePreview(null)
                setFile(null)
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ❌
            </button>
          )}
        </div>

        {filePreview ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                {filePreview.type === 'pdf' && '📄'}
                {filePreview.type === 'doc' && '📝'}
                {filePreview.type === 'txt' && '📃'}
                {filePreview.type === 'csv' && '📊'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {filePreview.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filePreview.size} • Ready to upload
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className={`mx-auto w-12 h-12 mb-3 rounded-lg flex items-center justify-center transition-all duration-200 ${dragOver
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 scale-110'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className={`font-medium mb-1 transition-colors ${dragOver
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
              }`}>
              {dragOver ? 'Drop your file here!' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              PDF, DOCX, TXT, CSV files supported
            </p>
          </div>
        )}
        <input
          id="file-input"
          type="file"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
              setFile(selectedFile)
              const fileType = selectedFile.name.split('.').pop().toLowerCase()
              const fileSize = (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB'
              setFilePreview({
                name: selectedFile.name,
                size: fileSize,
                type: fileType === 'pdf' ? 'pdf' :
                  fileType === 'docx' ? 'doc' :
                    fileType === 'txt' ? 'txt' :
                      fileType === 'csv' ? 'csv' : 'file'
              })
            }
          }}
          accept=".txt,.md,.pdf,.csv,.docx"
          className="hidden"
        />
      </div>
                
      {/* Upload Progress */}
      {ingesting && (file || uploadProgress > 0) && (
        <div className="mx-6 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={ingesting || (!text && !url && !file)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 transform ${
            ingesting || (!text && !url && !file)
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
          }`}
        >
          {ingesting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            'Add to Knowledge Base'
          )}
        </button>
      </div>
    </form>
  );
};

export default FileUpload;
