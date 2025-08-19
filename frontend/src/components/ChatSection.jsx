import { useState, useRef, useEffect } from 'react';

const ChatSection = ({
  messages,
  setMessages,
  question,
  setQuestion,
  chatLoading,
  chatLimit,
  rateLimitStatus,
  timeUntilReset,
  askChat
}) => {
  const messagesRef = useRef();

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const getRateLimitColor = () => {
    if (rateLimitStatus === 'exceeded') return 'text-red-500 dark:text-red-400';
    if (chatLimit.remaining <= 5) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  const getRateLimitBgColor = () => {
    if (rateLimitStatus === 'exceeded') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (chatLimit.remaining <= 5) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions about your uploaded content</p>
            </div>
          </div>

          {/* Rate Limit Status */}
          <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getRateLimitBgColor()}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getRateLimitColor().replace('text-', 'bg-')}`}></div>
              <span className={getRateLimitColor()}>
                {chatLimit.remaining}/{chatLimit.total} chats left
              </span>
            </div>
            {rateLimitStatus === 'exceeded' && timeUntilReset && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Resets in {timeUntilReset}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Ready to help!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Upload some content and start asking questions</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-800">
        <form onSubmit={askChat} className="space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  askChat(e)
                }
              }}
              className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={rateLimitStatus === 'exceeded' ? 'Chat limit exceeded. Please wait for reset.' : 'Ask a question about your uploaded content...'}
              rows={3}
              disabled={chatLoading || rateLimitStatus === 'exceeded'}
            />
            <button
              type="submit"
              disabled={chatLoading || !question.trim() || rateLimitStatus === 'exceeded'}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${chatLoading || !question.trim() || rateLimitStatus === 'exceeded'
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                }`}
            >
              {chatLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </section>
  );
};

export default ChatSection;
