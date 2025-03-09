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
      .then((response) => setChats(response.data.chats))
      .catch((error) => console.error("Error fetching chats", error));
  }, [token, userId]);

  return (
    <div>
      <h1>Your Chats</h1>
      {chats.length === 0 ? (
        <p>No active chats.</p>
      ) : (
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => navigate(`/app/conversation/${chat.id}`)}
            >
              Chat with{" "}
              {chat.user1Id === userId
                ? chat.user2Name || chat.user2Id
                : chat.user1Name || chat.user1Id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Chats;
