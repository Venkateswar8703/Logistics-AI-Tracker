import ChatAssistant from '../components/ChatAssistant';
import './ChatPage.css';

function ChatPage() {
  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <h1 className="page-title">AI Chat Assistant</h1>
        <p className="chat-page-subtitle">
          Get instant answers about your shipments, freight rates, and logistics operations
        </p>
      </div>
      <ChatAssistant />
    </div>
  );
}

export default ChatPage;
