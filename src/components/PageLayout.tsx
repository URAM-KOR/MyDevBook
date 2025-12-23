'use client';

import { container, spacing, colors, shadows } from '@/styles/design-tokens';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, BookOpen, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageLayout({ children, title, actionButton }: PageLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundColor: '#141414',
        background: 'linear-gradient(to bottom, #141414 0%, #000000 100%)',
      }}
    >
      {/* 배경 장식 요소들 - 넷플릭스 스타일 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'radial-gradient(ellipse at top, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 글로벌 내비게이션 바 */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="relative z-50"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: container.maxWidth,
            margin: '0 auto',
            padding: `${spacing.xs} ${container.padding}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* 로고 영역 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
            }}
            onClick={() => router.push('/portfolios')}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ fontSize: '28px' }}
            >
              🧚
            </motion.div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              FairyQuest
            </div>
          </motion.div>

          {/* 프로필 드롭다운 영역 */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={toggleDropdown}
              className="flex items-center gap-2 focus:outline-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0ea5e9&color=fff&rounded=true&size=40`}
                alt="Profile"
                className="w-10 h-10 rounded shadow-md border border-white/20"
              />
              <ChevronDown size={16} className={`text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  {/* User Greeting */}
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 min-w-0">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate max-w-full">{user?.name || 'Adventurer'}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1">
                    <button
                      onClick={() => { router.push('/portfolios'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                    >
                      <BookOpen size={16} />
                      My Quest Log
                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* 컨텐츠 영역 */}
      <div
        className="relative z-10"
        style={{
          padding: `${spacing.sm} ${spacing.sm} ${spacing.xl} ${spacing.sm}`,
        }}
      >
        <div
          style={{
            maxWidth: container.maxWidth,
            margin: '0 auto',
          }}
        >
          {title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.section,
              }}
            >
              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '-0.5px',
                }}
              >
                {title}
              </h1>
              {actionButton && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={actionButton.onClick}
                  style={{
                    padding: `${spacing.sm + 2}px ${spacing.md + 4}px`,
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 700,
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0284c7';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0ea5e9';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.4)';
                  }}
                >
                  {actionButton.label}
                </motion.button>
              )}
            </motion.div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

