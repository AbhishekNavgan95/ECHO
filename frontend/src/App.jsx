import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { getChatLimitFromStorage, updateChatLimitFromAPI, getRateLimitStatus, clearChatLimitStorage } from './utils/chatLimitStorage'

import Header from './components/Header.jsx'
import SessionSidebar from './components/SessionSidebar.jsx'
import SessionInput from './components/SessionInput.jsx'
import ChatSection from './components/ChatSection.jsx'
import Modal from './components/Modal.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

const App = () => {
  // UI State
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatLimit, setChatLimit] = useState(() => getChatLimitFromStorage())
  const [rateLimitStatus, setRateLimitStatus] = useState(() => getRateLimitStatus(getChatLimitFromStorage().remaining))
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  // Session State
  const [currentSession, setCurrentSession] = useState(null)
  const [sessionMessages, setSessionMessages] = useState([])
  const [showAddContextModal, setShowAddContextModal] = useState(false)
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0)
  const [sidebarWidth, setSidebarWidth] = useState(420)

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
      .catch(() => { })
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
    try { window.google.accounts.id.prompt() } catch { }
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
    } catch { }
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
    setSessionMessages([])
    setCurrentSession(null)
    setQuestion('')
    // Clear chat limit storage and reset to defaults aligned with backend (30)
    try { clearChatLimitStorage() } catch { }
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
    } catch { }
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
  }, [sessionMessages])

  // Session handlers
  const handleSessionSelect = async (session) => {
    setCurrentSession(session)
    // Load session messages
    if (session.messages) {
      setSessionMessages(session.messages)
    } else {
      setSessionMessages([])
    }
  }

  const handleNewSession = (session) => {
    setCurrentSession(session)
    setSessionMessages([])
  }

  const handleSessionUpdate = (updatedSession) => {
    setCurrentSession(updatedSession)
  }

  const handleSessionDelete = (sessionId) => {
    if (currentSession?.sessionId === sessionId) {
      setCurrentSession(null)
      setSessionMessages([])
    }
  }

  const handleInputAdded = (updatedSession) => {
    setCurrentSession(updatedSession)
    // Trigger session refresh to update counts in sidebar
    setSessionRefreshTrigger(prev => prev + 1)
    toast.success('Context added to session', {
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '16px 20px',
      },
    })
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

    if (!currentSession) {
      toast.error('Please select or create a session first', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      })
      return
    }

    const q = question.trim()
    if (!q) return

    setSessionMessages((m) => [...m, { sender: 'user', content: q }])
    setQuestion('')
    setChatLoading(true)

    // Add placeholder message for streaming response
    const assistantMessageIndex = sessionMessages.length + 1; // +1 for user message we just added
    setSessionMessages((m) => [...m, { sender: 'assistant', content: '' }])

    try {
      const response = await fetch(`${API_BASE}/sessions/${currentSession.sessionId}/chat`, {
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
          setSessionMessages((m) => {
            const newMessages = [...m]
            newMessages[assistantMessageIndex] = {
              sender: 'assistant',
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
                setSessionMessages((m) => {
                  const newMessages = [...m];
                  newMessages[assistantMessageIndex] = {
                    sender: 'assistant',
                    content: streamingContent
                  };
                  return newMessages;
                });
              } else if (data.type === 'end') {
                // Final update with complete content
                setSessionMessages((m) => {
                  const newMessages = [...m];
                  newMessages[assistantMessageIndex] = {
                    sender: 'assistant',
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

                // Trigger session refresh to update message count in sidebar
                setSessionRefreshTrigger(prev => prev + 1)
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
      setSessionMessages((m) => {
        const newMessages = [...m];
        newMessages[assistantMessageIndex] = {
          sender: 'assistant',
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
          chatLimit={chatLimit}
          rateLimitStatus={rateLimitStatus}
          timeUntilReset={timeUntilReset}
          onSignIn={startSignIn}
          onLogout={logout}
          googleBtnRef={googleBtnRef}
        />

        <main className="flex h-[calc(100vh-80px)]">
          {/* Session Sidebar */}
          <div 
            className="relative flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
            style={{ width: `${sidebarWidth}px` }}
          >
            <SessionSidebar
              user={user}
              currentSession={currentSession}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onSessionUpdate={handleSessionUpdate}
              onSessionDelete={handleSessionDelete}
              onAddContext={() => setShowAddContextModal(true)}
              refreshTrigger={sessionRefreshTrigger}
            />
            
            {/* Resize Handle */}
            <div 
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = sidebarWidth;
                
                const handleMouseMove = (e) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  const minWidth = 350;
                  const maxWidth = 500;
                  setSidebarWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-8 bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 rounded-l transition-colors" />
            </div>
          </div>

          {/* Main Content - Chat Section takes remaining width and height */}
          <div className="flex-1 flex flex-col max-h-screen" style={{ width: `calc(100vw - ${sidebarWidth}px - 48px)` }}>
            {healthChecking && (
              <div className="m-6 mb-0 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Backend server is booting up…</span>
              </div>
            )}

            {/* Chat Section */}
            <div className="flex-1 p-6 max-h-screen overflow-hidden">
              <ChatSection
                messages={sessionMessages}
                setMessages={setSessionMessages}
                question={question}
                setQuestion={setQuestion}
                chatLoading={chatLoading}
                chatLimit={chatLimit}
                rateLimitStatus={rateLimitStatus}
                timeUntilReset={timeUntilReset}
                askChat={askChat}
                currentSession={currentSession}
                onAddContext={() => setShowAddContextModal(true)}
              />
            </div>
          </div>
        </main>

        {/* Add Context Modal */}
        <Modal
          isOpen={showAddContextModal}
          onClose={() => setShowAddContextModal(false)}
          title="Add Context to Session"
        >
          <SessionInput
            currentSession={currentSession}
            onInputAdded={(session) => {
              handleInputAdded(session)
              setShowAddContextModal(false)
            }}
          />
        </Modal>
      </div>
    </div>
  )
}

export default App
