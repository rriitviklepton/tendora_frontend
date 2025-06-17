import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import PDFViewer from '../PDFViewer/PDFViewer';
import { 
  X, 
  SendHorizontal, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertTriangle,
  GripVertical,
  FileText
} from 'lucide-react';

// Add animation styles
const animationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes typing {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
    100% { content: '.'; }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }

  .typing-indicator::after {
    content: '.';
    animation: typing 1.5s infinite;
    display: inline-block;
    width: 1em;
    text-align: left;
  }

  .pulse-animation {
    animation: pulse 1.5s ease-in-out infinite;
  }

  /* Resize handle styles */
  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background-color: transparent;
    transition: background-color 0.2s;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background-color: #2563eb;
  }

  .resize-handle-icon {
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    color: #2563eb;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .resize-handle:hover .resize-handle-icon,
  .resize-handle.active .resize-handle-icon {
    opacity: 1;
  }

  /* Markdown styles */
  .markdown-content {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .markdown-content h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1rem 0;
  }

  .markdown-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.875rem 0;
  }

  .markdown-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0.75rem 0;
  }

  .markdown-content ul, .markdown-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .markdown-content li {
    margin: 0.25rem 0;
  }

  .markdown-content a {
    color: #2563eb;
    text-decoration: underline;
  }

  .markdown-content code {
    background-color: #f3f4f6;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }

  .markdown-content pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.5rem 0;
  }

  .markdown-content blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 0.5rem 0;
    color: #4b5563;
  }

  /* Table styles */
  .markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    font-size: 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .markdown-content thead {
    background-color: #f3f4f6;
  }

  .markdown-content th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }

  .markdown-content td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    color: #4b5563;
  }

  .markdown-content tr:last-child td {
    border-bottom: none;
  }

  .markdown-content tr:nth-child(even) {
    background-color: #f9fafb;
  }

  .markdown-content tr:hover {
    background-color: #f3f4f6;
  }
`;

// Simple function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface Message {
  text: string;
  isBot: boolean;
  isLoading?: boolean;
  references?: {
    pages: number[];
    pdfUrl?: string;
  };
}

interface Session {
  id: string;
  messages: Message[];
  number: number;
  tenderId?: number;
  tenderInfo?: TenderInfo;
}

interface TenderInfo {
  tender_id: number;
  title: string;
  reference_no: string;
  tender_info?: any;
  org_name?: string;
  document_url?: string;
}

interface AIAssistantProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AIAssistant = ({ open, setOpen }: AIAssistantProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(384); // Default width (96 * 4)
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const [sessions, setSessions] = useState<Session[]>([{
    id: generateId(),
    number: 1,
    messages: [{ 
      text: "👋 Hi! I'm your SmartTender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!", 
      isBot: true 
    }]
  }]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenders, setTenders] = useState<TenderInfo[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<number | undefined>();
  const [isFetchingTender, setIsFetchingTender] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [initialPage, setInitialPage] = useState<number | null>(null);

  const currentSession = sessions[currentSessionIndex];

  // Fetch tenders list from your main backend
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch('https://api.smarttender.rio.software/api/all-tenders?user_id=123');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            const formattedTenders = data.tenders.map((item: any) => ({
              tender_id: item.tender_id,
              title: item.tender_name,
              reference_no: item.tender_id.toString(),
              tender_info: item.tender_info
            }));
            setTenders(formattedTenders);
          } else {
            console.error('Failed to get tenders data');
          }
        } else {
          console.error('Failed to fetch tenders:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching tenders:', error);
      }
    };
    fetchTenders();
  }, []);

  // Fetch detailed tender info when a tender is selected
  const fetchTenderDetails = async (tenderId: number) => {
    setIsFetchingTender(true);
    try {
      const response = await fetch(`https://api.smarttender.rio.software/api/tender/${tenderId}?user_id=123`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const tenderInfo = {
            tender_id: data.tender.tender_id,
            title: data.tender.tender_name,
            reference_no: data.tender.tender_id.toString(),
            tender_info: data.tender.tender_info,
            org_name: data.tender.org_name || "lepton",
            document_url: `https://hlxdpsexbmfffxjycobl.supabase.co/storage/v1/object/public/tendors/${data.tender.org_name || "lepton"}/123/${data.tender.tender_id}/${data.tender.tender_id}_${encodeURIComponent(data.tender.tender_name)}.pdf`
          };
          // Update the current session with tender info
          const updatedSessions = [...sessions];
          updatedSessions[currentSessionIndex] = {
            ...currentSession,
            tenderId,
            tenderInfo
          };
          setSessions(updatedSessions);

          // Add a system message about the selected tender
          const tenderMessage = {
            text: `Tender context updated to: ${tenderInfo.title} (Organization: ${tenderInfo.org_name}).\nYou can now ask specific questions about this tender.`,
            isBot: true
          };
          updatedSessions[currentSessionIndex].messages.push(tenderMessage);
          setSessions(updatedSessions);
        } else {
          throw new Error('Failed to get tender data');
        }
      } else {
        throw new Error('Failed to fetch tender details');
      }
    } catch (error) {
      console.error('Error fetching tender details:', error);
    } finally {
      setIsFetchingTender(false);
    }
  };

  // Initialize session when tender is selected
  const initializeSession = async (sessionId: string, tenderId?: number) => {
    try {
      const response = await fetch(`https://api.smarttender.rio.software/chatbot/create-session?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tender_id: tenderId,
          user_id: 123, // Replace with actual user ID
          org_name: "lepton" // Replace with actual org name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize session');
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to initialize session');
      }

      return data.session_id;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    }
  };

  const handleTenderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenderId = e.target.value ? Number(e.target.value) : undefined;
    setSelectedTenderId(tenderId);
    
    if (tenderId) {
      try {
        // First fetch tender details
        await fetchTenderDetails(tenderId);
        
        // Then initialize a new session with the tender context
        await initializeSession(currentSession.id, tenderId);
      } catch (error) {
        console.error('Error setting up tender context:', error);
      }
    } else {
      // Clear tender info and reinitialize session without tender context
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex] = {
        ...currentSession,
        tenderId: undefined,
        tenderInfo: undefined,
        messages: [{
          text: "👋 Hi! I'm your SmartTender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!",
          isBot: true
        }]
      };
      setSessions(updatedSessions);
      
      // Initialize new session without tender context
      try {
        await initializeSession(currentSession.id);
      } catch (error) {
        console.error('Error reinitializing session:', error);
      }
    }
  };

  const startNewSession = async () => {
    const newSessionId = generateId();
    const newSession: Session = {
      id: newSessionId,
      number: sessions.length + 1,
      messages: [{
        text: "👋 Hi! I'm your SmartTender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!",
        isBot: true
      }]
    };

    try {
      // Initialize the new session
      await initializeSession(newSessionId);
      
      setSessions([...sessions, newSession]);
      setCurrentSessionIndex(sessions.length);
      setSelectedTenderId(undefined);
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  };

  // Clean up session when component unmounts or session changes
  useEffect(() => {
    const currentSessionId = currentSession?.id;
    
    return () => {
      if (currentSessionId) {
        fetch(`https://api.smarttender.rio.software/chatbot/session/${currentSessionId}`, {
          method: 'DELETE'
        }).catch(error => {
          console.error('Error cleaning up session:', error);
        });
      }
    };
  }, [currentSession?.id]);

  // Function to parse references from text
  const parseReferences = (text: string) => {
    const referenceMatch = text.match(/\[References - Page (\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\]/);
    if (referenceMatch) {
      const pagesStr = referenceMatch[1];
      const pages = pagesStr.split(/[,-]/).map(page => parseInt(page.trim()));
      return pages;
    }
    return null;
  };

  // Function to handle message updates with references
  const updateMessageWithReferences = (message: Message) => {
    const pages = parseReferences(message.text);
    if (pages) {
      return {
        ...message,
        references: {
          pages,
          pdfUrl: currentSession.tenderInfo?.document_url
        }
      };
    }
    return message;
  };

  // Modify the sendMessage function to handle references
  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentSession.tenderId) return;
    
    // Add user message
    const updatedSessions = [...sessions];
    updatedSessions[currentSessionIndex].messages.push({ text, isBot: false });
    
    // Add a loading message for the bot
    updatedSessions[currentSessionIndex].messages.push({ text: '', isBot: true, isLoading: true });
    setSessions(updatedSessions);
    
    setInputText('');
    setIsLoading(true);
    
    try {
      const payload = {
        prompt: text,
        session_id: currentSession.id,
        tender_id: currentSession.tenderId,
        user_id: 123,
        org_name: currentSession.tenderInfo?.org_name || "lepton",
        tender_info: currentSession.tenderInfo
      };

      console.log('Sending request to AI Assistant:', payload);

      const response = await fetch("https://api.smarttender.rio.software/chatbot/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      let fullResponse = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          const scrollContainer = chatContainerRef.current;
          const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 100;
          
          if (isAtBottom) {
            setTimeout(() => {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 0);
          }
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream complete');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          
          // Update the last message with the accumulated response
          const newSessions = [...sessions];
          const currentMessages = newSessions[currentSessionIndex].messages;
          const updatedMessage = updateMessageWithReferences({ 
            text: fullResponse, 
            isBot: true, 
            isLoading: false 
          });
          currentMessages[currentMessages.length - 1] = updatedMessage;
          setSessions(newSessions);
          
          // Check for references and show PDF viewer if needed
          if (updatedMessage.references) {
            setPdfUrl(updatedMessage.references.pdfUrl || '');
            setInitialPage(updatedMessage.references.pages[0]);
            setShowPdfViewer(true);
          }
          
          scrollToBottom();
        }
      } catch (streamError) {
        console.error('Error reading stream:', streamError);
        throw streamError;
      }
    } catch (err) {
      console.error("Error in sendMessage:", err);
      const errorSessions = [...sessions];
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      errorSessions[currentSessionIndex].messages.push({ 
        text: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`, 
        isBot: true,
        isLoading: false
      });
      setSessions(errorSessions);
    } finally {
      setIsLoading(false);
      // Final scroll to bottom
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const navigateSession = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSessionIndex > 0) {
      setCurrentSessionIndex(currentSessionIndex - 1);
      setSelectedTenderId(sessions[currentSessionIndex - 1].tenderId);
    } else if (direction === 'next' && currentSessionIndex < sessions.length - 1) {
      setCurrentSessionIndex(currentSessionIndex + 1);
      setSelectedTenderId(sessions[currentSessionIndex + 1].tenderId);
    }
  };

  // Add auto-scroll effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [sessions[currentSessionIndex].messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = startXRef.current - e.clientX;
    const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, 320), 800); // Min 320px, max 800px
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: `${width}px` }}
    >
      <style>{animationStyles}</style>
      
      {/* Resize handle */}
      <div
        className={`resize-handle ${isResizing ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle-icon">
          <GripVertical size={16} />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              SmartTender Assistant
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={() => navigateSession('prev')}
                disabled={currentSessionIndex === 0}
                className={`p-1 rounded-full hover:bg-gray-100 ${currentSessionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Previous session"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-medium">Session #{currentSession.number}</span>
              <button
                onClick={() => navigateSession('next')}
                disabled={currentSessionIndex === sessions.length - 1}
                className={`p-1 rounded-full hover:bg-gray-100 ${currentSessionIndex === sessions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Next session"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              onClick={startNewSession}
              title="Start new session"
            >
              <RefreshCw size={18} />
            </button>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tender Selection */}
        <div className="w-full mt-2">
          <select
            value={selectedTenderId || ''}
            onChange={handleTenderChange}
            className={`w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
              isFetchingTender ? 'opacity-50 cursor-wait' : ''
            }`}
            disabled={isFetchingTender || isLoading}
          >
            <option value="">Select a tender to start conversation</option>
            {tenders.map((tender) => (
              <option key={tender.tender_id} value={tender.tender_id}>
                {tender.title}
              </option>
            ))}
          </select>
          {!selectedTenderId && (
            <p className="mt-2 text-xs text-amber-600 flex items-center bg-amber-50 p-2 rounded-md">
              <AlertTriangle size={12} className="mr-1 flex-shrink-0" />
              Please select a tender to start the conversation
            </p>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex flex-col h-[calc(100%-8rem)]">
        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50"
        >
          {currentSession.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                  message.isBot
                    ? 'bg-white text-gray-800 border border-gray-100'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full pulse-animation" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full pulse-animation" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full pulse-animation" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 typing-indicator">Thinking</span>
                  </div>
                ) : message.isBot ? (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      remarkRehypeOptions={{ passThrough: ['link'] }}
                    >
                      {message.text}
                    </ReactMarkdown>
                    {message.references && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <FileText size={16} />
                        <button
                          onClick={() => {
                            setPdfUrl(message.references?.pdfUrl || '');
                            setInitialPage(message.references?.pages[0] || null);
                            setShowPdfViewer(true);
                          }}
                          className="hover:underline"
                        >
                          View referenced pages ({message.references.pages.join(', ')})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* PDF Viewer */}
        {showPdfViewer && pdfUrl && (
          <div className="h-1/2 border-t border-gray-200">
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Referenced Pages</h3>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-[calc(100%-40px)]">
              <PDFViewer pdfUrl={pdfUrl} initialPage={initialPage} />
            </div>
          </div>
        )}
        
        {/* Input area */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"   
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedTenderId ? "Ask me anything about this tender..." : "Please select a tender first..."}
              className={`flex-1 p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                !selectedTenderId ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
              }`}
              disabled={isLoading || !selectedTenderId}
            />
            <button
              className={`p-2.5 text-white rounded-lg transition-all duration-200 flex items-center justify-center w-12 h-[42px] ${
                isLoading || !inputText.trim() || !selectedTenderId 
                  ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
              }`}
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim() || !selectedTenderId}
              title={!selectedTenderId ? "Please select a tender first" : "Send message"}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizontal size={20} />
              )}
            </button>
          </div>
          {!selectedTenderId && inputText.trim() && (
            <p className="mt-2 text-xs text-amber-600 flex items-center bg-amber-50 p-2 rounded-md">
              <AlertTriangle size={12} className="mr-1 flex-shrink-0" />
              Please select a tender before sending a message
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;