import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '../AIAssistant/AIAssistant';
import FeedbackButton from '../Feedback/FeedbackButton';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const location = useLocation();
  const isTenderRoute = /^\/tender\//.test(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={() => setSidebarOpen(true)} 
          toggleAssistant={() => setAssistantOpen(!assistantOpen)}
        />
        
        <main className="flex-1 overflow-y-auto ">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Sidebar */}
      <AIAssistant open={assistantOpen} setOpen={setAssistantOpen} />

      {/* Feedback Button */}
      {isTenderRoute && <FeedbackButton />}
    </div>
  );
};

export default Layout;