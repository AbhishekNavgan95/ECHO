import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { getChatLimitFromStorage, updateChatLimitFromAPI, getRateLimitStatus } from './utils/chatLimitStorage'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const SUPPORTED_TYPES = ['.pdf', '.csv', '.txt', '.md']

const App = () => {

  // UI State
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [ingestStatus, setIngestStatus] = useState(null)
  const [ingesting, setIngesting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatLimit, setChatLimit] = useState(() => getChatLimitFromStorage())
  const [rateLimitStatus, setRateLimitStatus] = useState(() => getRateLimitStatus(getChatLimitFromStorage().remaining))
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [activeTab, setActiveTab] = useState('upload')
  const [dragOver, setDragOver] = useState(false)
  const [filePreview, setFilePreview] = useState(null)
  const [uploadHistory, setUploadHistory] = useState(() => JSON.parse(localStorage.getItem('uploadHistory') || '[]'))
  const [showSmartSuggestion, setShowSmartSuggestion] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const fileInputRef = useRef()
  const messagesRef = useRef()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update countdown timer
  useEffect(() => {
    if (!chatLimit.resetTimestamp) return

    const updateCountdown = () => {
      const now = Date.now()
      const resetTime = chatLimit.resetTimestamp
      const timeLeft = resetTime - now

      if (timeLeft <= 0) {
        setTimeUntilReset('Resetting...')
        // Reset limit locally when reset time is reached
        setTimeout(() => {
          const resetLimit = {
            used: 0,
            remaining: 20,
            total: 20,
            resetTime: null,
            resetTimestamp: null
          }
          setChatLimit(resetLimit)
          setRateLimitStatus('ok')
          updateChatLimitFromAPI(resetLimit)
        }, 1000)
        return
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`)
      } else {
        setTimeUntilReset(`${seconds}s`)
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [chatLimit.resetTimestamp])

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function ingestAll(e) {
    e.preventDefault()
    setIngestStatus(null)
    if (!text.trim() && !url.trim() && !file) {
      setIngestStatus({ ok: false, error: 'Add at least one of: text, file, or URL' })
      return
    }
    setIngesting(true)
    setUploadProgress(0)
    try {
      const form = new FormData()
      if (text.trim()) form.append('text', text.trim())
      if (url.trim()) form.append('url', url.trim())
      if (file) form.append('file', file)
      const res = await axios.post(`${API_BASE}/ingest`, form, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(pct)
          }
        }
      })
      const data = res.data
      if (!data.ok) throw new Error(data.error || 'Failed to ingest')

      // Show custom success toast
      toast.success(`Created ${data.chunks} chunks`, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#10b981',
        },
      })

      // Add to upload history
      const historyItem = {
        timestamp: Date.now(),
        name: '',
        type: '',
        content: ''
      }

      if (text.trim()) {
        historyItem.name = text.trim().substring(0, 50) + (text.trim().length > 50 ? '...' : '')
        historyItem.type = 'text'
        historyItem.content = text.trim()
      } else if (url.trim()) {
        historyItem.name = url.trim()
        historyItem.type = 'url'
        historyItem.content = url.trim()
      } else if (file) {
        historyItem.name = file.name
        historyItem.type = 'file'
        historyItem.content = file.name
      }

      const newHistory = [historyItem, ...uploadHistory].slice(0, 10) // Keep only last 10 items
      setUploadHistory(newHistory)
      localStorage.setItem('uploadHistory', JSON.stringify(newHistory))

      setText('')
      setUrl('')
      setFile(null)
      setFilePreview(null)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unknown error occurred'

      // Show custom error toast
      toast.error(errorMsg, {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.04)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#ef4444',
        },
      })
    } finally {
      setIngesting(false)
      // allow the progress bar to finish visually
      setTimeout(() => setUploadProgress(0), 600)
    }
  }

  // Drag-and-drop handlers
  function handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFile(file)

      // Create file preview
      const fileType = file.name.split('.').pop().toLowerCase()
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB'

      setFilePreview({
        name: file.name,
        size: fileSize,
        type: fileType === 'pdf' ? 'pdf' :
          fileType === 'docx' ? 'doc' :
            fileType === 'txt' ? 'txt' :
              fileType === 'csv' ? 'csv' : 'file'
      })
    }
  }

  // Smart text splitting function
  const splitTextIntoSections = (text) => {
    // Split by common section indicators
    const sections = []

    // First try to split by numbered headings (1., 2., etc.)
    let parts = text.split(/(?=\d+\.\s+[A-Z])/g).filter(part => part.trim())

    if (parts.length < 2) {
      // Try splitting by bullet points or dashes
      parts = text.split(/(?=[-•]\s+)/g).filter(part => part.trim())
    }

    if (parts.length < 2) {
      // Try splitting by double line breaks (paragraphs)
      parts = text.split(/\n\s*\n/).filter(part => part.trim())
    }

    if (parts.length < 2) {
      // Try splitting by sentences if text is very long
      const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim())
      if (sentences.length > 3) {
        const chunkSize = Math.ceil(sentences.length / 3)
        for (let i = 0; i < sentences.length; i += chunkSize) {
          parts.push(sentences.slice(i, i + chunkSize).join('. ') + '.')
        }
      }
    }

    // Clean up and format sections
    parts.forEach((part, index) => {
      const cleanPart = part.trim()
      if (cleanPart.length > 20) { // Only include substantial sections
        sections.push({
          title: `Section ${index + 1}`,
          content: cleanPart,
          preview: cleanPart.substring(0, 60) + (cleanPart.length > 60 ? '...' : '')
        })
      }
    })

    return sections.length > 1 ? sections : null
  }

  const handleTextSplit = () => {
    const sections = splitTextIntoSections(text)
    if (sections) {
      // Format the split text with clear section headers
      const formattedText = sections.map((section, index) =>
        `=== ${section.title} ===\n${section.content}`
      ).join('\n\n')

      setText(formattedText)
      setShowSmartSuggestion(false)
    }
  }

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function askChat(e) {
    e.preventDefault()
    const q = question.trim()
    if (!q) return
    setMessages((m) => [...m, { role: 'user', content: q }])
    setQuestion('')
    setChatLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/chat`, { question: q });
      const data = res.data;
      if (!data.ok) {
        throw new Error(data.error || 'Chat request failed');
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);

      // Update chat limit from response and sync to local storage
      if (data.chatLimit) {
        const updatedLimit = updateChatLimitFromAPI(data.chatLimit);
        setChatLimit(updatedLimit);
        setRateLimitStatus(getRateLimitStatus(updatedLimit.remaining));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unknown error occurred';
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${errorMsg}` }]);

      // Handle rate limit exceeded
      if (err.response?.data?.rateLimitExceeded) {
        const exhaustedLimit = updateChatLimitFromAPI({ remaining: 0 });
        setChatLimit(exhaustedLimit);
        setRateLimitStatus('exceeded');
      }
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'backdrop-blur-sm',
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ECHO
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Intelligent Document Analysis & Chat</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://github.com/AbhishekNavgan95/ECHO" target="_blank" rel="noopener noreferrer" className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                </a>
                <a
                  href='https://abhisheknavgan.xyz/'
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                >
                  <span>Meet me here!</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className="absolute -bottom-1 left-1/2 w-4/5 h-0.5 bg-white/30 rounded-full transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
            {/* Left column: Data ingestion */}
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
                  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upload'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
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
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'upload' ? (
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
                        className="group relative w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 active:scale-95 shadow-lg hover:shadow-2xl disabled:shadow-none flex items-center justify-center gap-2 overflow-hidden"
                      >
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-400 group-hover:to-indigo-500 transition-all duration-300"></div>

                        {/* Button content */}
                        <div className="relative flex items-center gap-2">
                          {ingesting ? (
                            <>
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add to Knowledge Base
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* History Tab */
                  <div className="space-y-4">
                    {uploadHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No upload history yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your recent uploads will appear here</p>
                      </div>
                    ) : (
                      uploadHistory.slice(0, 5).map((item, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                {item.type === 'text' && '📝'}
                                {item.type === 'url' && '🌐'}
                                {item.type === 'file' && '📂'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {(item.type === 'text' || item.type === 'url') && (
                              <button
                                onClick={() => {
                                  if (item.type === 'text') {
                                    setText(item.content)
                                    setActiveTab('upload')
                                  } else if (item.type === 'url') {
                                    setUrl(item.content)
                                    setActiveTab('upload')
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Reuse
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </section>

            {/* Right column: Chat UI */}
            <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">AI Assistant</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions about your knowledge base</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setMessages([])}
                      disabled={messages.length === 0}
                      className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Clear Chat
                    </button>
                  </div>

                  {/* Enhanced Chat Limit Display */}
                  <div className="flex items-center gap-3">
                    {/* Rate Limit Status Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${rateLimitStatus === 'exceeded'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/20'
                      : rateLimitStatus === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 shadow-yellow-100 dark:shadow-yellow-900/20'
                        : rateLimitStatus === 'ok'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                      } shadow-lg`}>
                      {/* Status Icon */}
                      <div className={`w-2 h-2 rounded-full ${rateLimitStatus === 'exceeded' ? 'bg-red-500 animate-pulse'
                        : rateLimitStatus === 'warning' ? 'bg-yellow-500 animate-pulse'
                          : rateLimitStatus === 'ok' ? 'bg-green-500'
                            : 'bg-gray-400 animate-pulse'
                        }`}></div>

                      {/* Chat Count */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-semibold">{chatLimit.remaining}/{chatLimit.total}</span>
                        <span className="text-xs opacity-75">left</span>
                      </div>

                      {/* Reset Timer */}
                      {(rateLimitStatus === 'exceeded' || rateLimitStatus === 'warning') && timeUntilReset && (
                        <div className="flex items-center gap-1 text-xs opacity-75 border-l pl-2 ml-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Reset in {timeUntilReset}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div ref={messagesRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Ready to help you explore your knowledge</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add some content first, then start asking questions</p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}>
                        {m.role === 'user' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 animate-pulse"></div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm w-full">
                        <div className="animate-pulse flex flex-col gap-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                {/* Enhanced Rate Limit Warning */}
                {rateLimitStatus === 'exceeded' && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Daily Chat Limit Reached!</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                          You've used all {chatLimit.total} daily chats. Your limit will reset automatically.
                        </p>
                        {timeUntilReset && (
                          <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Resets in: {timeUntilReset}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {rateLimitStatus === 'warning' && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-medium">Only {chatLimit.remaining} chats remaining today!</span>
                    </div>
                  </div>
                )}

                <form onSubmit={askChat} className="flex items-end gap-3">
                  <div className="flex-1">
                    <input
                      className={`w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400 ${chatLimit.remaining <= 0
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 cursor-not-allowed opacity-60'
                        : 'border-gray-200 dark:border-gray-600 focus:ring-purple-500'
                        }`}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={chatLimit.remaining <= 0 ? "Daily chat limit reached..." : "Ask anything about your knowledge base..."}
                      disabled={chatLoading || chatLimit.remaining <= 0}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={chatLoading || !question.trim() || chatLimit.remaining <= 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 shadow-lg disabled:shadow-none flex items-center justify-center"
                  >
                    {chatLoading ? (
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App