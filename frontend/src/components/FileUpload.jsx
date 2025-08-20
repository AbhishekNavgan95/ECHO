import { useEffect, useState } from 'react'
import { FileText, Globe, FileUp } from 'lucide-react'

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
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState('text') // 'text' | 'url' | 'file'

  const switchMode = (m) => {
    setMode(m)
    if (m === 'text') {
      setUrl('')
      setFile(null)
      setFilePreview(null)
    } else if (m === 'url') {
      setText('')
      setShowSmartSuggestion(false)
      setFile(null)
      setFilePreview(null)
    } else if (m === 'file') {
      setText('')
      setShowSmartSuggestion(false)
      setUrl('')
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('kb_input_mode')
    if (saved === 'text' || saved === 'url' || saved === 'file') {
      setMode(saved)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('kb_input_mode', mode)
  }, [mode])

  // Auto-switch mode when values are populated externally (e.g., from UploadHistory)
  useEffect(() => {
    if (text && mode !== 'text') {
      setMode('text');
      setUrl('')
      setFile(null)
      setFilePreview(null)
    }
  }, [text])

  useEffect(() => {
    if (url && mode !== 'url') {
      setMode('url')
      
    }
  }, [url])

  useEffect(() => {
    if (file && mode !== 'file') setMode('file')
  }, [file])

  return (
    <form onSubmit={e => { e.preventDefault(); ingestAll(e) }} className="space-y-6">
      {/* Input Mode Selector */}
      <div>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-3">Choose a source to add to your Knowledge Base</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'text', label: 'Text', icon: <FileText className="w-6 h-6" />, desc: 'Paste notes' },
            { key: 'url', label: 'URL', icon: <Globe className="w-6 h-6" />, desc: 'Import website' },
            { key: 'file', label: 'File', icon: <FileUp className="w-6 h-6" />, desc: 'Upload document' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => switchMode(opt.key)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border backdrop-blur-md transition-all duration-200 shadow-sm group
                ${mode === opt.key
                  ? 'border-blue-500 bg-gradient-to-br from-blue-100/70 to-indigo-200/40 dark:from-blue-900/30 dark:to-indigo-800/20 text-blue-600 scale-[1.02] shadow-md'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:scale-[1.02] hover:shadow-md'
                }`}
            >
              <div className={`mb-2 p-2 rounded-lg transition-colors ${mode === opt.key ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {opt.icon}
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TEXT MODE */}
      {mode === 'text' && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="w-5 h-5" /> Text Content
            </label>
            {text && (
              <button type="button" onClick={() => { setText(''); setShowSmartSuggestion(false) }} className="text-gray-400 hover:text-red-500 transition-colors">❌</button>
            )}
          </div>
          <textarea
            value={text}
            rows={6}
            onChange={(e) => {
              setText(e.target.value)
              if (e.target.value.length > 100 && !showSmartSuggestion) setShowSmartSuggestion(true)
            }}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Paste or type your notes here…"
          />
          {showSmartSuggestion && text.length > 100 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">💡 Would you like to split this into sections automatically?</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleTextSplit} className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600">Yes, split it</button>
                <button type="button" onClick={() => setShowSmartSuggestion(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">No, thanks</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL MODE */}
      {mode === 'url' && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Globe className="w-5 h-5" /> Website URL
            </label>
            {url && (<button type="button" onClick={() => setUrl('')} className="text-gray-400 hover:text-red-500 transition-colors">❌</button>)}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Enter a website link…"
          />
        </div>
      )}

      {/* FILE MODE */}
      {mode === 'file' && (
        <div className={`rounded-xl p-4 border-2 border-dashed transition-all cursor-pointer group ${dragOver ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              setFile(files[0]);
              const fileType = files[0].name.split('.').pop().toLowerCase();
              const fileSize = (files[0].size / 1024 / 1024).toFixed(2) + ' MB';
              setFilePreview({ name: files[0].name, size: fileSize, type: fileType });
            }
          }}
          onClick={() => document.getElementById('file-input')?.click()}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileUp className="w-5 h-5" /> Upload File
            </label>
            {filePreview && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setFilePreview(null); setFile(null) }} className="text-gray-400 hover:text-red-500 transition-colors">❌</button>
            )}
          </div>
          {filePreview ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{filePreview.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{filePreview.size} • Ready to upload</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className={`mx-auto w-12 h-12 mb-3 rounded-lg flex items-center justify-center ${dragOver ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                <FileUp className="w-6 h-6" />
              </div>
              <p className={`font-medium mb-1 ${dragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {dragOver ? 'Drop your file here!' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">PDF, TXT, CSV, MD supported (no DOCX)</p>
            </div>
          )}
          <input id="file-input" type="file" accept=".txt,.md,.pdf,.csv" className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0]
              if (selectedFile) {
                setFile(selectedFile)
                const fileType = selectedFile.name.split('.').pop().toLowerCase()
                const fileSize = (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB'
                setFilePreview({ name: selectedFile.name, size: fileSize, type: fileType })
              }
            }}
          />
        </div>
      )}

      {/* Tips (outside input fields) */}
      {mode === 'text' && (
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">Tips for best responses:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Use clear structure with headings (e.g., H1/H2), short paragraphs, and bullet points.</li>
            <li>Include context like titles, dates, authors, and key terms at the top.</li>
            <li>Separate unrelated topics into separate entries for cleaner embeddings.</li>
            <li>Avoid extremely long, unformatted blocks; split large text using the smart-split.</li>
          </ul>
        </div>
      )}

      {mode === 'url' && (
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Page must be publicly accessible (no login/paywall) and allow crawlers (robots.txt should not block).</li>
            <li>Prefer canonical URLs; avoid infinite scroll or content loaded only after interactions.</li>
            <li>For multi-page docs, provide a sitemap or list of URLs for better coverage.</li>
          </ul>
        </div>
      )}

      {mode === 'file' && (
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Supported formats: PDF, TXT, CSV, MD (no DOCX).</li>
            <li>Prefer text-based PDFs (scanned images may not parse correctly).</li>
            <li>For CSV, include a header row and consistent delimiters.</li>
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {ingesting && (file || uploadProgress > 0) && (
        <div className="mx-6 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={ingesting || (mode === 'text' ? !text : mode === 'url' ? !url : !file)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 transform 
            ${ingesting || (mode === 'text' ? !text : mode === 'url' ? !url : !file)
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
  )
}

export default FileUpload
