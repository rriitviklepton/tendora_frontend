import { useEffect, useState } from "react";

// Simple function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function GeminiSessionChat() {
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [sessionId] = useState<string>(() => generateId());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch("https://api.smarttender.rio.software/chatbot/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setResponse(fullResponse);
      }

      // Add assistant's response to chat
      const assistantMessage: ChatMessage = { role: 'assistant', content: fullResponse };
      setMessages(prev => [...prev, assistantMessage]);
      setPrompt(""); // Clear input after successful send
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
      setResponse(""); // Clear the streaming response
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4">
      <div className="flex-1 overflow-auto mb-4 bg-gray-50 rounded-lg p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%]' 
                : 'bg-white mr-auto max-w-[80%] shadow'
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">
              {message.content}
            </pre>
          </div>
        ))}
        {isLoading && response && (
          <div className="bg-white mr-auto max-w-[80%] shadow mb-4 p-3 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans">{response}</pre>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          rows={3}
          className="w-full border rounded-lg p-2 resize-none"
          placeholder="Ask me anything..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <button 
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className={`px-4 py-2 rounded-lg text-white font-medium
            ${isLoading || !prompt.trim() 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default GeminiSessionChat; 