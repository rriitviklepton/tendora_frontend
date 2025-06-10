import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, FileText, FolderArchive, BarChart, Settings, Package, Send, FileSearch } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Tenders', href: '/tenders', icon: FileText },
    { name: 'Documents', href: '/documents', icon: FolderArchive },
    // { name: 'Submission', href: '/submission', icon: Send },
    // { name: 'OCR Convert', href: '/ocr-convert', icon: FileSearch },
    // { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for all screen sizes */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-800 to-indigo-900 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header and close button */}
        <div className="flex items-center justify-between h-16  px-4 border-b border-white">
          <div className="flex items-center ">
           <h1 className="text-white font-bold text-2xl">Smart Tender</h1>
          </div>
          <button
            type="button"
            className="text-blue-800 hover:text-blue-600 focus:outline-none"
            onClick={() => setOpen(false)}
          >
            <X  className="text-white"size={24} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Status info */}
        <div className="absolute bottom-0 w-full px-4 py-3 bg-blue-800 border-t border-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Organization: TechSolutions</p>
              <p className="text-xs text-blue-200">Pro Plan - Valid until April 2026</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;