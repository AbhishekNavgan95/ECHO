import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png'

const Header = ({ theme, setTheme, user, onSignIn, onLogout, googleBtnRef }) => {

  return (
    <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-6 py-4">
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
            <div className="flex items-center gap-3">
              <a href="https://abhisheknavgan.xyz" target="_blank" rel="noopener noreferrer" className="hidden sm:flex mr-2 group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 items-center gap-2">
                Find me here
              </a>
            {!user && (
              <div className="flex items-center gap-2">
                <div ref={googleBtnRef}></div>
              </div>
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
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.186l3.71-3.955a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
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

export default Header;
