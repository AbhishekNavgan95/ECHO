import { FileText } from 'lucide-react';
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
  askChat,
  currentSession,
  onAddContext
}) => {
  const [speechState, setSpeechState] = useState({
    isSpeaking: false,
    currentMessageId: null,
    utterance: null
  });
  const messagesRef = useRef();

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const getRateLimitColor = () => {
    if (rateLimitStatus === 'exceeded') return 'text-red-500 dark:text-red-400';
    if (rateLimitStatus === 'warning') return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  const getRateLimitBgColor = () => {
    if (rateLimitStatus === 'exceeded') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (rateLimitStatus === 'warning') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col h-full max-h-[calc(100vh-120px)]">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {currentSession ? currentSession.name : 'AI Assistant'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentSession
                  ? `Session with ${currentSession.totalInputs || 0} context sources`
                  : 'Select a session to start chatting'
                }
              </p>
            </div>
          </div>

          {/* Add Context Button */}
          {currentSession && onAddContext && (
            <button
              onClick={onAddContext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-700"
              title="Add Context to Session"
            >
              <FileText className="h-4 w-4" />
              Add Context
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {currentSession ? 'Ready to chat!' : 'No session selected'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {currentSession
                ? 'Ask questions about your session context'
                : 'Create or select a session to start chatting'
              }
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 mb-6 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
              {/* Profile Icon - Always present for both user and assistant */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {msg.role === 'user' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  )}
                </svg>
              </div>

              <div className={`relative max-w-[80%] rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                <div className="flex flex-col gap-y-4 justify-between items-start gap-2 p-4">
                  <div className="w-full">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && msg.content !== '' && (
                    <button
                      onClick={() => {
                        if (speechState.isSpeaking && speechState.currentMessageId === i) {
                          // Pause if currently speaking this message
                          window.speechSynthesis.pause();
                          setSpeechState(prev => ({ ...prev, isSpeaking: false }));
                        } else if (speechState.currentMessageId === i) {
                          // Resume if this message was paused
                          window.speechSynthesis.resume();
                          setSpeechState(prev => ({ ...prev, isSpeaking: true }));
                        } else {
                          // Start new speech
                          window.speechSynthesis.cancel(); // Stop any current speech

                          const utterance = new SpeechSynthesisUtterance(msg.content);
                          utterance.rate = 1;
                          utterance.pitch = 1;
                          utterance.volume = 1;

                          utterance.onend = () => {
                            setSpeechState({
                              isSpeaking: false,
                              currentMessageId: null,
                              utterance: null
                            });
                          };

                          utterance.onpause = () => {
                            setSpeechState(prev => ({ ...prev, isSpeaking: false }));
                          };

                          utterance.onresume = () => {
                            setSpeechState(prev => ({ ...prev, isSpeaking: true }));
                          };

                          window.speechSynthesis.speak(utterance);
                          setSpeechState({
                            isSpeaking: true,
                            currentMessageId: i,
                            utterance
                          });
                        }
                      }}
                      className={`text-xs flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${speechState.currentMessageId === i && speechState.isSpeaking
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-400 dark:hover:bg-gray-500 text-gray-950 dark:text-gray-950'
                        }`}
                      title={speechState.currentMessageId === i && speechState.isSpeaking ? 'Pause' : 'Read aloud'}
                      aria-label={speechState.currentMessageId === i && speechState.isSpeaking ? 'Pause' : 'Read aloud'}
                    >
                      <span>{speechState.currentMessageId === i && speechState.isSpeaking ? 'Pause' : 'Read Aloud'}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {speechState.currentMessageId === i && speechState.isSpeaking ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-6-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Copy Button - positioned on opposite side of sender */}
              <button
                className={`opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-gray-900/90 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 self-start mt-2 ${
                  msg.role === 'user' ? 'order-first' : 'order-last'
                }`}
                title="Copy message"
                onClick={() => {
                  navigator.clipboard.writeText(msg.content);
                }}
                aria-label="Copy message"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
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
              placeholder={
                rateLimitStatus === 'exceeded'
                  ? 'Chat limit exceeded. Please wait for reset.'
                  : currentSession
                    ? 'Ask a question about your session context...'
                    : 'Select a session to start chatting...'
              }
              rows={3}
              disabled={chatLoading || rateLimitStatus === 'exceeded' || !currentSession}
            />
            <button
              type="submit"
              disabled={chatLoading || !question.trim() || rateLimitStatus === 'exceeded' || !currentSession}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${chatLoading || !question.trim() || rateLimitStatus === 'exceeded' || !currentSession
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
