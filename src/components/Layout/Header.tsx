import React from 'react';
import { Menu, Bell, MessageSquareText, ChevronDown, User } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  toggleAssistant: () => void;
}

const Header = ({ toggleSidebar, toggleAssistant }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-2 text-xl font-semibold text-gray-800">Lepton</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* AI Assistant button */}
          <button
            type="button"
            className="p-2 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            onClick={toggleAssistant}
          >
            <MessageSquareText size={20} />
          </button>
          
          {/* Notifications */}
          {/* <button
            type="button"
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button> */}
          
          {/* User profile */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <User size={18} />
              </div>
              <span className="hidden md:block text-sm font-medium">Rahul Sharma</span>
              <ChevronDown size={16} />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg hidden group-hover:block">
              <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </a>
              <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </a>
              <a href="#logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Sign out
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;