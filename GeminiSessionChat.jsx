import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

function GeminiSessionChat() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse("");
    setError(null);
    setIsLoading(true);

    const payload = {
      prompt: prompt,
      session_id: sessionId
    };

    try {
      const res = await fetch("http://  :8000/chatbot/stream", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Get the response reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Read the streaming response
      let responseText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        setResponse(responseText);
      }
    } catch (err) {
      setError(`Failed to get response: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          rows={3}
          className="w-full border rounded p-2"
          placeholder="Ask me anything..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />
        <button 
          className={`mt-2 px-4 py-2 bg-blue-600 text-white rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="p-4 bg-gray-100 rounded min-h-[100px] whitespace-pre-wrap">
        {response || 'Response will appear here...'}
      </div>
    </div>
  );
}

export default GeminiSessionChat; 