import React, { useState, useRef, useEffect } from 'react';
import { 
  useGetNotifications, 
  useMarkAsReadMutation, 
  useDeleteNotificationMutation 
} from '@/features/notification/notification.hooks';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useGetNotifications();
  const { mutate: markAsRead } = useMarkAsReadMutation();
  const { mutate: deleteNotification } = useDeleteNotificationMutation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 px-4 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Đang tải...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có thông báo nào</p>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="cursor-pointer flex-1" 
                      onClick={() => !item.isRead && markAsRead(item.id)}
                    >
                      <h4 className={`text-sm ${!item.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                      <span className="text-[10px] text-gray-400 mt-2 block">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};