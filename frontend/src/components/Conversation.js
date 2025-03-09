// Conversation.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../Constants";

const Conversation = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/conversation/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, token]);

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

  return (
    <div>
      <h1>Conversation</h1>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderId === userId ? "You" : msg.senderId}: </strong>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type your message (max 100 chars)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={100}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Conversation;
