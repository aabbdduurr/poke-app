// Chats.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";

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
        // Sort chats by createdAt or last message timestamp (descending)
        const sortedChats = response.data.chats.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setChats(sortedChats);
      })
      .catch((error) => console.error("Error fetching chats", error));
  }, [token, userId]);

  return (
    <div>
      <h1>Your Chats</h1>
      {chats.length === 0 ? (
        <p>No active chats.</p>
      ) : (
        <ul>
          {chats.map((chat) => {
            // Determine partner name and turn indicator
            const partnerName =
              chat.user1Id === userId
                ? chat.user2Name || chat.user2Id
                : chat.user1Name || chat.user1Id;
            const turnIndicator =
              chat.turn === userId ? "Your turn" : "Not your turn";
            return (
              <li
                key={chat.id}
                onClick={() => navigate(`/conversation/${chat.id}`)}
              >
                Chat with {partnerName} – {turnIndicator}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Chats;
