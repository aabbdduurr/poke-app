// PokeLog.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";

const PokeLog = () => {
  const [pokes, setPokes] = useState([]);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/pokes/incoming?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setPokes(response.data.pokes))
      .catch((error) => console.error("Error fetching pokes", error));
  }, [token, userId]);

  const handleStartChat = (conversationId) => {
    navigate(`/conversation/${conversationId}`);
  };

  return (
    <div>
      <h1>Poke Log</h1>
      {pokes.length === 0 ? (
        <p>No new pokes.</p>
      ) : (
        <ul>
          {pokes.map((poke) => (
            <li key={poke.id}>
              From: {poke.fromUserId}
              {/* You might show more details by fetching user info */}
              <button
                onClick={() => handleStartChat(poke.conversationId || poke.id)}
              >
                Respond / Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PokeLog;
