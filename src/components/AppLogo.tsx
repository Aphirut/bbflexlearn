import React from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Sparkles, BookOpen, Shield, Infinity, Layers } from 'lucide-react';

import { AppSettings } from '../types';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  overrideSettings?: Partial<AppSettings>;
}

export const PRESET_LOGOS = [
  { id: 'flexlearn_badge', name: 'FlexLearn Badge', icon: GraduationCap, color: 'from-indigo-600 to-blue-600' },
  { id: 'sparkle_helix', name: 'Sparkle Innovate', icon: Sparkles, color: 'from-amber-500 to-orange-600' },
  { id: 'book_open', name: 'Knowledge Book', icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
  { id: 'shield_code', name: 'Security Shield', icon: Shield, color: 'from-cyan-600 to-blue-600' },
  { id: 'infinity_loop', name: 'Infinite Growth', icon: Infinity, color: 'from-violet-600 to-purple-600' },
  { id: 'layers_stack', name: 'Layered Skills', icon: Layers, color: 'from-rose-500 to-pink-600' }
];

export const LOGO_BG_COLORS: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-white' },
  blue: { bg: 'bg-blue-600', text: 'text-white' },
  purple: { bg: 'bg-purple-600', text: 'text-white' },
  emerald: { bg: 'bg-emerald-600', text: 'text-white' },
  cyan: { bg: 'bg-cyan-600', text: 'text-white' },
  rose: { bg: 'bg-rose-600', text: 'text-white' },
  slate: { bg: 'bg-slate-900', text: 'text-white' }
};

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', showText = false, className = '', overrideSettings }) => {
  const { appSettings } = useApp();
  const settings = { ...appSettings, ...overrideSettings };

  const sizeClasses = {
    xs: { box: 'w-6 h-6 rounded-md text-[10px]', icon: 'w-3.5 h-3.5', text: 'text-sm' },
    sm: { box: 'w-7 h-7 rounded-lg text-xs', icon: 'w-4 h-4', text: 'text-base' },
    md: { box: 'w-8 h-8 rounded-lg text-xs', icon: 'w-4 h-4', text: 'text-lg' },
    lg: { box: 'w-10 h-10 rounded-xl text-sm', icon: 'w-5 h-5', text: 'text-xl' },
    xl: { box: 'w-14 h-14 rounded-2xl text-base', icon: 'w-7 h-7', text: 'text-2xl' }
  }[size];

  const bgColorConfig = LOGO_BG_COLORS[settings.logoBgColor || 'indigo'] || LOGO_BG_COLORS.indigo;
  const isImage = settings.logoType === 'image' && Boolean(settings.logoUrl);

  const matchedPreset = PRESET_LOGOS.find(p => p.id === settings.presetLogoId);
  const PresetIcon = matchedPreset ? matchedPreset.icon : GraduationCap;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {isImage ? (
        <img
          src={settings.logoUrl}
          alt={settings.appName}
          className={`${sizeClasses.box} object-cover shadow-sm border border-slate-200/80 bg-white`}
          onError={(e) => {
            // Fallback to monogram on image error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : settings.presetLogoId && settings.presetLogoId !== 'monogram' && matchedPreset ? (
        <div
          className={`${sizeClasses.box} bg-gradient-to-br ${matchedPreset.color} text-white flex items-center justify-center shadow-sm shrink-0`}
        >
          <PresetIcon className={sizeClasses.icon} />
        </div>
      ) : (
        <div
          className={`${sizeClasses.box} ${bgColorConfig.bg} ${bgColorConfig.text} flex items-center justify-center font-extrabold tracking-wider shadow-sm shrink-0`}
        >
          {settings.appShortName || 'BB'}
        </div>
      )}

      {showText && (
        <span className={`font-bold tracking-tight text-slate-900 ${sizeClasses.text}`}>
          {settings.appName || 'BB FlexLearn'}
        </span>
      )}
    </div>
  );
};
