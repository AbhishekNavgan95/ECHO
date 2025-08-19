import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { getChatLimitFromStorage, updateChatLimitFromAPI, getRateLimitStatus } from './utils/chatLimitStorage'
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

  async function ingestAll(e) {
    e.preventDefault()
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
        <Header theme={theme} setTheme={setTheme} />

        <main className="mx-auto max-w-7xl px-6 py-8">
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
