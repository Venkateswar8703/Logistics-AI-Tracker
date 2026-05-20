import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, ExternalLink, RotateCcw } from 'lucide-react';
import { sendChatMessage, getChatSuggestions } from '../services/api';
import './ChatAssistant.css';

const defaultSuggestions = [
  'Where is my shipment TRK-2024-001?',
  'Show me all delayed shipments',
  'What are the cheapest air freight rates?',
  'Compare shipping options from Shanghai to LA',
  'How many shipments are in transit?',
  'What is the average delivery time?',
];

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Load suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await getChatSuggestions();
        if (data?.suggestions?.length) {
          setSuggestions(data.suggestions);
        }
      } catch {
        // Use defaults
      }
    };
    loadSuggestions();
  }, []);

  const handleSend = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, sessionId);

      if (response?.session_id) {
        setSessionId(response.session_id);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response?.response || response?.message || 'I received your message.',
        timestamp: new Date(),
        sources: response?.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the backend server is running and try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    inputRef.current?.focus();
  };

  const showSuggestions = messages.length === 0;

  return (
    <div className="chat-assistant">
      {/* Messages Area */}
      <div className="chat-messages">
        {showSuggestions && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Sparkles size={32} />
            </div>
            <h3 className="chat-welcome-title">Logistics AI Assistant</h3>
            <p className="chat-welcome-desc">
              Ask me anything about your shipments, freight rates, delivery status, and more.
            </p>
            <div className="chat-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="chat-suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message chat-message--${msg.role} ${msg.isError ? 'chat-message--error' : ''}`}
          >
            <div className="chat-message-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="chat-message-content">
              <div className="chat-message-bubble">
                <p className="chat-message-text">{msg.content}</p>
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="chat-message-sources">
                  <span className="chat-sources-label">Sources:</span>
                  {msg.sources.map((source, i) => (
                    <span key={i} className="chat-source-tag">
                      <ExternalLink size={10} />
                      {source.title || source}
                    </span>
                  ))}
                </div>
              )}
              <span className="chat-message-time">
                {msg.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-avatar">
              <Bot size={16} />
            </div>
            <div className="chat-message-content">
              <div className="chat-message-bubble">
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        {messages.length > 0 && (
          <button className="chat-new-session" onClick={handleNewSession} title="New conversation">
            <RotateCcw size={16} />
          </button>
        )}
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask about shipments, rates, or tracking..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={`chat-send-btn ${input.trim() ? 'chat-send-btn--active' : ''}`}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatAssistant;
