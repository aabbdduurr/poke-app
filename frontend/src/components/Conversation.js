// Conversation.js
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../Constants";
import "./Conversation.css";

const Conversation = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/conversation/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Sort messages by timestamp ascending (oldest first)
      const sorted = response.data.messages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setMessages(sorted);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (input.length > 100) {
      alert("Message exceeds 100 characters");
      return;
    }
    try {
      await axios.post(
        `${BACKEND_URL}/message`,
        { conversationId, senderId: userId, content: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInput("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  // Utility to format timestamp to "HH:MM"
  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="conversation-container">
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${
              msg.senderId === userId ? "sent" : "received"
            }`}
          >
            {msg.senderId !== userId && (
              <div className="sender-name">{msg.senderName || "Them"}</div>
            )}
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">
              {formatTimestamp(msg.timestamp)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message (max 100 chars)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={100}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Conversation;
