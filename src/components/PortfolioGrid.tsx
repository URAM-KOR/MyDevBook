'use client';

import { Portfolio } from '@/types';
import { motion } from 'framer-motion';
import { Edit, Plus } from 'lucide-react';
import { useState } from 'react';
import PortfolioCard from './PortfolioCard';
import WeatherOverlay, { WeatherStatus } from './WeatherOverlay';

interface PortfolioGridProps {
  portfolios: Portfolio[];
  onEdit: (portfolio: Portfolio) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function PortfolioGrid({ portfolios, onEdit, onAdd, onDelete }: PortfolioGridProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    setHighlightedId(id);
    setTimeout(() => {
      setHighlightedId(null);
    }, 500);
  };

  return (
    <div className="pb-20">

      {/* ---------- MOBILE VIEW (List) ---------- */}
      <div className="flex flex-col gap-1 px-2 md:hidden">
        {portfolios.map((portfolio, index) => {
          const weatherStatus: WeatherStatus = portfolio.weather_status || 'healthy';
          const isHighlighted = highlightedId === portfolio.id;

          return (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCardClick(portfolio.id)}
              className="group relative flex items-center justify-between p-3 rounded-lg overflow-hidden"
            >
              {/* Highlight Overlay */}
              <motion.div
                className="absolute inset-0 bg-white pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHighlighted ? 0.1 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
              {/* Hover Overlay */}
              <motion.div
                className="absolute inset-0 bg-white pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.05 }}
                transition={{ duration: 0.2 }}
              />
              {/* Edit Button - Top Right of Card */}
              <button
                className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-all z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(portfolio);
                }}
              >
                <Edit size={12} />
              </button>

              {/* Left: Thumbnail & Info */}
              <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-[120px] h-[68px] flex-shrink-0 rounded-md overflow-hidden bg-zinc-800 flex items-center justify-center">
                  <img
                    src={portfolio.image_url || ''}
                    alt={portfolio.title}
                    className="w-full h-full object-contain object-center group-active:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x120?text=No+Image';
                    }}
                  />
                  <WeatherOverlay status={weatherStatus} />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-white font-bold text-sm truncate mb-1">
                    {portfolio.title}
                  </h4>
                  {portfolio.tracking_prompt && (
                    <p className="text-gray-400 text-xs truncate mb-0.5" title={portfolio.tracking_prompt}>
                      🎯 {portfolio.tracking_prompt}
                    </p>
                  )}
                  {portfolio.current_value && (
                    <p className="text-gray-500 text-xs truncate mb-0.5" title={portfolio.current_value}>
                      📊 {portfolio.current_value}
                    </p>
                  )}
                  {portfolio.encouragement_message && (
                    <p 
                      className={`text-xs italic line-clamp-3 break-words ${
                        weatherStatus === 'healthy' ? 'text-green-400' : 
                        weatherStatus === 'alert' ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}
                      title={portfolio.encouragement_message}
                    >
                      ✨ {portfolio.encouragement_message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Mobile Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onAdd}
          className="flex items-center gap-4 p-3 cursor-pointer active:bg-white/10 rounded-lg mt-2"
        >
          <div className="w-[120px] h-[68px] flex items-center justify-center rounded-md bg-zinc-800 border-2 border-dashed border-zinc-600">
            <Plus className="text-zinc-400" />
          </div>
          <span className="text-zinc-400 font-medium">Add New Quest</span>
        </motion.div>
      </div>

      {/* ---------- DESKTOP VIEW (Grid) ---------- */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {portfolios.map((portfolio) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Desktop Add Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAdd}
          className="relative w-[140px] h-[200px] lg:w-[200px] lg:h-[280px] rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer group transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
            <Plus className="text-zinc-400 group-hover:text-white" />
          </div>
          <span className="text-zinc-500 font-medium group-hover:text-zinc-300">New Portfolio</span>
        </motion.div>
      </div>
    </div>
  );
}

