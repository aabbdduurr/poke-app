// Chats.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";
import "./Chats.css"; // Assume you have a CSS file for theming

const Chats = () => {
  const [chats, setChats] = useState([]);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/chats?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        // Sort chats by createdAt (or last message timestamp)
        const sortedChats = response.data.chats.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setChats(sortedChats);
      })
      .catch((error) => console.error("Error fetching chats", error));
  }, [token, userId]);

  return (
    <div className="chats-container">
      <h1>Your Chats</h1>
      {chats.length === 0 ? (
        <p>No active chats.</p>
      ) : (
        <ul className="chat-list">
          {chats.map((chat) => {
            const partnerName =
              chat.user1Id === userId
                ? chat.user2Name || chat.user2Id
                : chat.user1Name || chat.user1Id;
            const turnIndicator =
              chat.turn === userId ? "Your turn" : "Not your turn";
            return (
              <li
                key={chat.id}
                className="chat-item"
                onClick={() => navigate(`/conversation/${chat.id}`)}
              >
                <div className="chat-partner">{partnerName}</div>
                <div className="chat-turn-indicator">{turnIndicator}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Chats;
