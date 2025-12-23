'use client';

import { motion } from 'framer-motion';

interface AddCardProps {
  onClick: () => void;
}

export default function AddCard({ onClick }: AddCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '140px',
        height: '200px',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        border: '2px dashed #404040',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="add-card-mobile group"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0ea5e9';
        e.currentTarget.style.backgroundColor = '#2a2a2a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#404040';
        e.currentTarget.style.backgroundColor = '#1a1a1a';
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            marginBottom: '8px',
            borderRadius: '50%',
            backgroundColor: '#2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          className="group-hover:bg-[#0ea5e9] transition-colors"
        >
          <svg
            style={{ width: '20px', height: '20px', color: '#a3a3a3' }}
            className="group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p
          style={{ color: '#a3a3a3', fontWeight: 600, fontSize: '11px' }}
          className="group-hover:text-white transition-colors"
        >
          새로 만들기
        </p>
      </div>
      
      <style jsx>{`
        @media (min-width: 768px) {
          .add-card-mobile {
            width: 200px !important;
            height: 280px !important;
          }
        }
      `}</style>
    </motion.button>
  );
}
