import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import Logo from '@/assets/images/Logo.webp';

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 w-full flex items-center justify-between px-6 shadow-sm sticky top-0 z-40">
      <div className="flex items-center">
        <Link to="/">
          <img src={Logo} alt="UIT Connect Logo" className="h-8 object-contain" />
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold cursor-pointer hover:bg-blue-200 transition-colors">
          U
        </div>
      </div>
    </header>
  );
};