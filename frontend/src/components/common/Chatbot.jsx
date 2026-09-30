import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMessageSquare, FiMinimize2 } from 'react-icons/fi';
import api from '../../utils/api';
import './Chatbot.css';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là Lumi AI, trợ lý ảo thông minh của LumiStay Hotel & Resort. ✨\n\nTôi có thể hỗ trợ bạn tìm phòng, xem giá, chính sách đặt phòng và giải đáp mọi thắc mắc. Bạn cần tôi giúp gì hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickChips = [
    'Xem các hạng phòng & giá',
    'Giờ nhận và trả phòng',
    'Dịch vụ hồ bơi & spa',
    'Chính sách hủy phòng',
    'Bữa sáng có miễn phí không?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageToSend) => {
    const text = messageToSend || input;
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { message: text });
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.message
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Xin lỗi, tôi đang gặp chút sự cố kết nối. Quý khách vui lòng gọi hotline: **+84 258 123 4567** để được hỗ trợ tức thì.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-floating-window">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-brand">
          <div className="chatbot-avatar">
            <span className="online-indicator"></span>
            🤖
          </div>
          <div className="chatbot-header-text">
            <strong>Lumi AI</strong>
            <span>Trợ lý ảo 24/7 • Trực tuyến</span>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button onClick={onClose} className="chat-btn-icon" title="Đóng">
            <FiX />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-wrap ${m.sender}`}>
            {m.sender === 'bot' && <div className="chat-bot-icon">🤖</div>}
            <div className={`chat-bubble ${m.sender}`}>
              <p style={{ whiteSpace: 'pre-line' }}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrap bot">
            <div className="chat-bot-icon">🤖</div>
            <div className="chat-bubble bot typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      <div className="chatbot-chips">
        {quickChips.map((chip, idx) => (
          <button key={idx} className="chip-btn" onClick={() => handleSend(chip)}>
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chatbot-input-bar">
        <input 
          type="text" 
          placeholder="Nhập câu hỏi của bạn..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={!input.trim() || loading} className="chat-send-btn">
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
