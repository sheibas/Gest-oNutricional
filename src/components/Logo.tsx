import React from 'react';
import { Apple, Dumbbell } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { text: 'text-xl', icon: 'w-6 h-6', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { text: 'text-2xl sm:text-3xl', icon: 'w-8 h-8', badge: 'text-xs px-2 py-0.5' },
    lg: { text: 'text-3xl sm:text-4xl', icon: 'w-10 h-10', badge: 'text-sm px-2.5 py-1' },
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* Logo Badge Icon */}
        <div className="relative flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-900 border border-rose-500/30 glow-red-sm shadow-lg shadow-rose-950/50 group">
          <Apple className={`${sizeMap[size].icon} text-white transition-transform group-hover:scale-110 duration-300`} />
          <div className="absolute -bottom-1 -right-1 bg-black p-0.5 rounded-full border border-rose-500/40">
            <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
          </div>
        </div>

        {/* Logo Brand Name */}
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight ${sizeMap[size].text} flex items-center`}>
            <span className="text-white">Nutri</span>
            <span className="bg-gradient-to-r from-rose-500 to-red-600 bg-clip-text text-transparent ml-0.5">
              Padel
            </span>
          </div>
          <span className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase -mt-1">
            Gestão Nutricional
          </span>
        </div>
      </div>
    </div>
  );
};
