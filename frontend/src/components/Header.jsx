import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import { ChevronsLeftRightEllipsis, TerminalSquare, TrendingUp, UserRound, X, HelpCircle } from 'lucide-react';

const Header = ({ theme, setTheme, user, onSignIn, onLogout, googleBtnRef, chatLimit, rateLimitStatus, timeUntilReset }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <img src={logo} alt="ECHO" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ECHO
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Intelligent Document Analysis & Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://abhisheknavgan.xyz" target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-2 text-gray-500 underline dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <TerminalSquare />
              Unlock a secret
            </a>
            {/* Chat Limit Display */}
            {user && chatLimit && (
              <div className='space-x-2 flex items-center'>
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${rateLimitStatus === 'exceeded' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                  rateLimitStatus === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className={rateLimitStatus === 'exceeded' ? 'text-red-500 dark:text-red-400' :
                      rateLimitStatus === 'warning' ? 'text-yellow-500 dark:text-yellow-400' :
                        'text-green-500 dark:text-green-400'}>
                      {chatLimit.remaining}/{chatLimit.total} chats left
                    </span>
                  </div>
                  {rateLimitStatus === 'exceeded' && timeUntilReset && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Resets in {timeUntilReset}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Paise lagte hai bhai unlimited nahi de sakta 🥲. 
                      Open AI, Pinecone, Render wale mere Chacha k ladke nahi h 🙂
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!user && (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <TrendingUp />
                </button>

                <LoginModal
                  isOpen={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                  googleBtnRef={googleBtnRef}
                  onSignIn={onSignIn}
                />
              </>
            )}
            {user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </div>
    </header>
  );
};

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md "
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
          <img src={user?.avatarUrl || "https://ui-avatars.com/api/?name=Abhishek Navgan".replaceAll(" ", "%20")} alt={user?.email || 'User'} className="w-full h-full object-cover" />
        </div>
        <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{user.name || user.email}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.186l3.71-3.955a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-20">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name || 'Account'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const LoginModal = ({ isOpen, onClose, googleBtnRef, onSignIn }) => {
  const modalRef = useRef(null)
  const [mounted, setMounted] = useState(false)


  useEffect(() => {
    if (!isOpen) return
    setMounted(true)

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    // focus the modal container for accessibility
    const toFocus = modalRef.current?.querySelector('[data-autofocus]') || modalRef.current
    toFocus && toFocus.focus()

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      setMounted(false)
    }
  }, [isOpen, onClose])



  if (!isOpen) return null

  return (
    <div
      className={`fixed h-screen inset-0 to-0 z-50 p-4 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className={`w-full max-w-md outline-none focus:outline-none bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all duration-200 transform ${mounted ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-2 sm:scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 dark:from-indigo-400/10 dark:via-blue-400/10 dark:to-cyan-400/10 mb-4 ring-1 ring-inset ring-gray-200/50 dark:ring-white/10">
              <img src={logo} alt="ECHO" className="h-8 w-8 object-contain" />
            </div>
            <h3 id="login-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sign in to ECHO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Your AI workspace for documents and chat</p>

            <div className="mt-6">
              <div ref={googleBtnRef} className="flex justify-center" data-autofocus></div>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              By continuing, you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header;
