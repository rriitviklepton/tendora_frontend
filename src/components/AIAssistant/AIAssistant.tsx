import React, { useState, useEffect } from 'react';
import { 
  X, 
  SendHorizontal, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';

// Simple function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface Message {
  text: string;
  isBot: boolean;
  isLoading?: boolean;
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
}

interface AIAssistantProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AIAssistant = ({ open, setOpen }: AIAssistantProps) => {
  const [sessions, setSessions] = useState<Session[]>([{
    id: generateId(),
    number: 1,
    messages: [{ 
      text: "👋 Hi! I'm your AI Tender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!", 
      isBot: true 
    }]
  }]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenders, setTenders] = useState<TenderInfo[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<number | undefined>();
  const [isFetchingTender, setIsFetchingTender] = useState(false);

  const currentSession = sessions[currentSessionIndex];

  // Fetch tenders list from your main backend
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch('http://localhost:8000/all-tenders?user_id=123');
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
      const response = await fetch(`http://127.0.0.1:8000/tender/${tenderId}?user_id=123`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const tenderInfo = {
            tender_id: data.tender.tender_id,
            title: data.tender.tender_name,
            reference_no: data.tender.tender_id.toString(),
            tender_info: data.tender.tender_info,
            org_name: data.tender.org_name || "lepton"
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
      const response = await fetch(`http://localhost:8001/create-session?session_id=${sessionId}`, {
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
          text: "👋 Hi! I'm your AI Tender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!",
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
        text: "👋 Hi! I'm your AI Tender Assistant. To get started, please select a tender from the dropdown above. Once selected, I can help you with:\n\n• Understanding tender requirements\n• Analyzing submission processes\n• Explaining eligibility criteria\n• Clarifying technical specifications\n• And more!",
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
        fetch(`http://localhost:8001/session/${currentSessionId}`, {
          method: 'DELETE'
        }).catch(error => {
          console.error('Error cleaning up session:', error);
        });
      }
    };
  }, [currentSession?.id]);

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
        user_id: 123, // Replace with actual user ID
        org_name: currentSession.tenderInfo?.org_name || "lepton", // Use org_name from tender info or default
        tender_info: currentSession.tenderInfo
      };

      console.log('Sending request to AI Assistant:', payload);

      const response = await fetch("http://localhost:8001/stream", {
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

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
          currentMessages[currentMessages.length - 1] = { text: fullResponse, isBot: true, isLoading: false };
          setSessions(newSessions);
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

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-800">AI Assistant</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={() => navigateSession('prev')}
                disabled={currentSessionIndex === 0}
                className={`p-0.5 rounded hover:bg-gray-100 ${currentSessionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Previous session"
              >
                <ChevronLeft size={14} />
              </button>
              <span>Session #{currentSession.number}</span>
              <button
                onClick={() => navigateSession('next')}
                disabled={currentSessionIndex === sessions.length - 1}
                className={`p-0.5 rounded hover:bg-gray-100 ${currentSessionIndex === sessions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Next session"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
              onClick={startNewSession}
              title="Start new session"
            >
              <RefreshCw size={18} />
            </button>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tender Selection */}
        <div className="w-full">
          <select
            value={selectedTenderId || ''}
            onChange={handleTenderChange}
            className={`w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            <p className="mt-2 text-xs text-amber-600 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              Please select a tender to start the conversation
            </p>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex flex-col h-[calc(100%-8rem)]">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {currentSession.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.isBot
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Input area */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center">
            <input
              type="text"   
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedTenderId ? "Ask me anything about this tender..." : "Please select a tender first..."}
              className={`flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !selectedTenderId ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || !selectedTenderId}
            />
            <button
              className={`p-2 text-white rounded-r-md transition-colors ${
                isLoading || !inputText.trim() || !selectedTenderId 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim() || !selectedTenderId}
              title={!selectedTenderId ? "Please select a tender first" : ""}
            >
              <SendHorizontal size={20} />
            </button>
          </div>
          {!selectedTenderId && inputText.trim() && (
            <p className="mt-2 text-xs text-amber-600 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              Please select a tender before sending a message
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;