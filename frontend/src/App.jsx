import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

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
  const [chatLimit, setChatLimit] = useState({ used: 0, remaining: 10, total: 10, resetTime: null, resetTimestamp: null })
  const [rateLimitStatus, setRateLimitStatus] = useState('loading') // 'loading', 'ok', 'warning', 'exceeded'
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const fileInputRef = useRef()
  const messagesRef = useRef()

  // Fetch chat limit on component mount and periodically
  useEffect(() => {
    const fetchChatLimit = async () => {
      try {
        const res = await axios.get(`${API_BASE}/chat-limit`)
        if (res.data.ok) {
          const limitData = {
            used: res.data.used,
            remaining: res.data.remaining,
            total: res.data.total,
            resetTime: res.data.resetTime,
            resetTimestamp: res.data.resetTimestamp
          }
          setChatLimit(limitData)
          
          // Update rate limit status
          if (limitData.remaining <= 0) {
            setRateLimitStatus('exceeded')
          } else if (limitData.remaining <= 2) {
            setRateLimitStatus('warning')
          } else {
            setRateLimitStatus('ok')
          }
        }
      } catch (err) {
        console.error('Failed to fetch chat limit:', err)
        setRateLimitStatus('error')
      }
    }
    
    // Fetch immediately
    fetchChatLimit()
    
    // Fetch every 30 seconds to keep status updated
    const interval = setInterval(fetchChatLimit, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Update countdown timer
  useEffect(() => {
    if (!chatLimit.resetTimestamp) return
    
    const updateCountdown = () => {
      const now = Date.now()
      const resetTime = chatLimit.resetTimestamp
      const timeLeft = resetTime - now
      
      if (timeLeft <= 0) {
        setTimeUntilReset('Resetting...')
        // Refetch chat limit when reset time is reached
        setTimeout(() => {
          const fetchChatLimit = async () => {
            try {
              const res = await axios.get(`${API_BASE}/chat-limit`)
              if (res.data.ok) {
                setChatLimit({
                  used: res.data.used,
                  remaining: res.data.remaining,
                  total: res.data.total,
                  resetTime: res.data.resetTime,
                  resetTimestamp: res.data.resetTimestamp
                })
                setRateLimitStatus(res.data.remaining > 0 ? 'ok' : 'exceeded')
              }
            } catch (err) {
              console.error('Failed to fetch chat limit:', err)
            }
          }
          fetchChatLimit()
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
      setIngestStatus({ ok: true, message: `Created ${data.chunks} chunks` })
      setText('')
      setUrl('')
      setFile(null)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unknown error occurred'
      setIngestStatus({ ok: false, error: errorMsg })
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

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
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
      
      // Update chat limit from response
      if (data.chatLimit) {
        const newLimit = { ...chatLimit, ...data.chatLimit };
        setChatLimit(newLimit);
        
        // Update rate limit status
        if (newLimit.remaining <= 0) {
          setRateLimitStatus('exceeded');
        } else if (newLimit.remaining <= 2) {
          setRateLimitStatus('warning');
        } else {
          setRateLimitStatus('ok');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unknown error occurred';
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${errorMsg}` }]);
      
      // Handle rate limit exceeded
      if (err.response?.data?.rateLimitExceeded) {
        setChatLimit(prev => ({ ...prev, remaining: 0 }));
        setRateLimitStatus('exceeded');
      }
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
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
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
          {/* Left column: Data ingestion */}
          <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Add Knowledge</h2>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Upload documents, paste text, or add URLs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Content is processed and stored as embeddings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Ask questions and get AI-powered answers
                  </li>
                </ul>
              </div>
            </div>
            <form onSubmit={e=>{e.persist?.();ingestAll(e)}} className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Text Content
                </label>
                <textarea
                  className="w-full h-32 border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your content here..."
                />
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Upload File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".txt,.md,.pdf,.csv"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{Math.round((file.size || 0) / 1024)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {SUPPORTED_TYPES.join(', ')} files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={ingesting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
              >
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Add to Knowledge Base
                  </>
                )}
              </button>

              {/* Status Message */}
              {ingestStatus && (
                <div className={`p-4 rounded-xl border ${ingestStatus.ok 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {ingestStatus.ok ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="font-medium">
                      {ingestStatus.ok ? ingestStatus.message : ingestStatus.error}
                    </span>
                  </div>
                </div>
              )}
              {/* Upload Progress */}
              {ingesting && (file || uploadProgress > 0) && (
                <div className="space-y-2">
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
            </form>
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
                
                {/* Enhanced Chat Limit Display */}
                <div className="flex items-center gap-3">
                  {/* Rate Limit Status Indicator */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    rateLimitStatus === 'exceeded'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/20'
                      : rateLimitStatus === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 shadow-yellow-100 dark:shadow-yellow-900/20'
                      : rateLimitStatus === 'ok'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-900/20'
                      : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                  } shadow-lg`}>
                    {/* Status Icon */}
                    <div className={`w-2 h-2 rounded-full ${
                      rateLimitStatus === 'exceeded' ? 'bg-red-500 animate-pulse'
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.role === 'user' 
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
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      m.role === 'user' 
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
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
                    className={`w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400 ${
                      chatLimit.remaining <= 0 
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
  )
}

export default App