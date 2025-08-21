import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { getChatLimitFromStorage, updateChatLimitFromAPI, getRateLimitStatus, clearChatLimitStorage } from './utils/chatLimitStorage'

import Header from './components/Header.jsx'
import KnowledgeBase from './components/KnowledgeBase.jsx'
import ChatSection from './components/ChatSection.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

const App = () => { 
  // UI State
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
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
  const [filePreview, setFilePreview] = useState(null)
  const [uploadHistory, setUploadHistory] = useState(() => JSON.parse(localStorage.getItem('uploadHistory') || '[]'))
  const [showSmartSuggestion, setShowSmartSuggestion] = useState(false)
  
  // Refs
  const messagesRef = useRef(null)

  // Backend health check state
  const [healthChecking, setHealthChecking] = useState(true)
  const [serverHealthy, setServerHealthy] = useState(false)
  const [healthError, setHealthError] = useState(null)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth state
  const [user, setUser] = useState(null)
  const googleBtnRef = useRef(null)
  const googleInitializedRef = useRef(false)

  useEffect(() => {
    // fetch session
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d?.ok && d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  // Handle Google credential and exchange with backend
  const handleGoogleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential })
      })
      const data = await res.json()
      if (data.ok) setUser(data.user)
      else toast.error(data.error || 'Login failed')
    } catch (e) {
      toast.error('Login failed')
    }
  }

  // Initialize Google Sign-In and render the button when available
  const initializeGoogleAuth = () => {
    if (user || googleInitializedRef.current) return
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !window.google || !googleBtnRef.current) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large' })
    googleInitializedRef.current = true
  }

  // Try to auto-initialize when script and ref are ready
  useEffect(() => {
    let cancelled = false
    const tryInit = () => { if (!cancelled) initializeGoogleAuth() }
    const i = setInterval(tryInit, 300)
    tryInit()
    return () => { cancelled = true; clearInterval(i) }
  }, [user])

  // Manual start for users if button didn't render yet
  function startSignIn() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('Google Sign-In not configured. Set VITE_GOOGLE_CLIENT_ID in frontend env.')
      return
    }
    if (!window.google) {
      toast('Loading Google Sign-In…', { icon: '⏳' })
      return
    }
    initializeGoogleAuth()
    try { window.google.accounts.id.prompt() } catch {}
  }

  // Fetch chat limit from server and sync to UI/local storage
  async function refreshChatLimitFromServer() {
    try {
      const res = await fetch(`${API_BASE}/chat-limit`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.ok) {
        const updated = updateChatLimitFromAPI({
          used: data.used,
          remaining: data.remaining,
          total: data.total,
          resetTime: data.resetTime,
          resetTimestamp: data.resetTimestamp,
        })
        setChatLimit(updated)
        setRateLimitStatus(getRateLimitStatus(updated.remaining))
      }
    } catch {}
  }

  // On login/session restore, load current limit
  useEffect(() => {
    if (user) refreshChatLimitFromServer()
  }, [user])

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
    // Clear all user-related state
    setUser(null)
    setMessages([])
    setQuestion('')
    setUploadHistory([])
    localStorage.setItem('uploadHistory', JSON.stringify([]))
    // Clear chat limit storage and reset to defaults aligned with backend (30)
    try { clearChatLimitStorage() } catch {}
    const resetLimitOnLogout = { used: 0, remaining: 30, total: 30, resetTime: null, resetTimestamp: null }
    setChatLimit(resetLimitOnLogout)
    updateChatLimitFromAPI(resetLimitOnLogout)
    setRateLimitStatus('ok')
    // Re-enable Google button rendering without full page refresh
    try {
      if (googleBtnRef.current) googleBtnRef.current.innerHTML = ''
      googleInitializedRef.current = false
      // Allow React to render the sign-in container, then initialize
      setTimeout(() => {
        initializeGoogleAuth()
      }, 0)
    } catch {}
  }

  // Ping backend health on initial load
  useEffect(() => {
    let aborted = false
    const controller = new AbortController()

    async function ping() {
      try {
        setHealthChecking(true)
        setHealthError(null)
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal, cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (aborted) return
        setServerHealthy(!!data.ok)
      } catch (e) {
        if (aborted) return
        setHealthError(e.message || 'Failed to reach server')
      } finally {
        if (!aborted) setHealthChecking(false)
      }
    }

    ping()
    return () => { aborted = true; controller.abort() }
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
        // Reset limit locally when reset time is reached
        setTimeout(() => {
          const resetLimit = {
            used: 0,
            remaining: 30,
            total: 30,
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
    if (!user) {
      toast.error('Please sign in to add to your knowledge base', {
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
      return
    }
    if (!text.trim() && !url.trim() && !file) {
      toast.error('Add at least one of: text, file, or URL')
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
        withCredentials: true,
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
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
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

  async function askChat(e) {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to chat', {
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
      return
    }
    const q = question.trim()
    if (!q) return

    setMessages((m) => [...m, { role: 'user', content: q }])
    setQuestion('')
    setChatLoading(true)

    // Add placeholder message for streaming response
    const assistantMessageIndex = messages.length + 1; // +1 for user message we just added
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ question: q }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || ''
      // Fallback for non-SSE JSON responses (e.g., empty docs case)
      if (!contentType.includes('text/event-stream')) {
        const data = await response.json().catch(() => null)
        if (data && data.ok) {
          const answerText = data.answer || ''
          setMessages((m) => {
            const newMessages = [...m]
            newMessages[assistantMessageIndex] = {
              role: 'assistant',
              content: answerText
            }
            return newMessages
          })
          if (data.chatLimit) {
            const updatedLimit = updateChatLimitFromAPI(data.chatLimit)
            setChatLimit(updatedLimit)
            setRateLimitStatus(getRateLimitStatus(updatedLimit.remaining))
          }
          setChatLoading(false)
          return
        }
        throw new Error(data?.error || 'Unexpected response from server')
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamingContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                // Update chat limit from initial response
                if (data.chatLimit) {
                  const updatedLimit = updateChatLimitFromAPI(data.chatLimit);
                  setChatLimit(updatedLimit);
                  setRateLimitStatus(getRateLimitStatus(updatedLimit.remaining));
                }
              } else if (data.type === 'chunk') {
                // Update streaming content
                streamingContent += data.content;
                setMessages((m) => {
                  const newMessages = [...m];
                  newMessages[assistantMessageIndex] = {
                    role: 'assistant',
                    content: streamingContent
                  };
                  return newMessages;
                });
              } else if (data.type === 'end') {
                // Final update with complete content
                setMessages((m) => {
                  const newMessages = [...m];
                  newMessages[assistantMessageIndex] = {
                    role: 'assistant',
                    content: data.fullContent || streamingContent
                  };
                  return newMessages;
                });

                // Update chat limit from final response
                if (data.chatLimit) {
                  const updatedLimit = updateChatLimitFromAPI(data.chatLimit);
                  setChatLimit(updatedLimit);
                  setRateLimitStatus(getRateLimitStatus(updatedLimit.remaining));
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error occurred');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'An unknown error occurred';
      setMessages((m) => {
        const newMessages = [...m];
        newMessages[assistantMessageIndex] = {
          role: 'assistant',
          content: `Error: ${errorMsg}`
        };
        return newMessages;
      });

      // Handle rate limit exceeded (check if it's a rate limit error)
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
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
        <Header 
          theme={theme} 
          setTheme={setTheme} 
          user={user} 
          onSignIn={startSignIn} 
          onLogout={logout} 
          googleBtnRef={googleBtnRef}
        />

        <main className="mx-auto max-w-7xl px-6 py-8">
          {/* Auth banner removed; controls moved to Header */}
          {healthChecking && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>Backend server is booting up…</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
            <KnowledgeBase 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              text={text}
              setText={setText}
              url={url}
              setUrl={setUrl}
              file={file}
              setFile={setFile}
              filePreview={filePreview}
              setFilePreview={setFilePreview}
              uploadHistory={uploadHistory}
              setUploadHistory={setUploadHistory}
              ingesting={ingesting}
              uploadProgress={uploadProgress}
              ingestAll={ingestAll}
              showSmartSuggestion={showSmartSuggestion}
              setShowSmartSuggestion={setShowSmartSuggestion}
              handleTextSplit={handleTextSplit}
            />
            
            <ChatSection 
              messages={messages}
              setMessages={setMessages}
              question={question}
              setQuestion={setQuestion}
              chatLoading={chatLoading}
              chatLimit={chatLimit}
              rateLimitStatus={rateLimitStatus}
              timeUntilReset={timeUntilReset}
              askChat={askChat}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App