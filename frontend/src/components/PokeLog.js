// PokeLog.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";

const PokeLog = () => {
  const [pokes, setPokes] = useState([]);
  const [outgoingPokes, setOutgoingPokes] = useState([]);
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

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/pokes/outgoing?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setOutgoingPokes(response.data.pokes))
      .catch((error) => console.error("Error fetching outgoing pokes", error));
  }, [token, userId]);

  const handleStartChat = (conversationId) => {
    navigate(`/conversation/${conversationId}`);
  };

  const handlePokeBack = (poke) => {
    // When poking back, swap fromUserId and toUserId:
    axios
      .post(
        `${BACKEND_URL}/poke`,
        {
          fromUserId: userId, // current user pokes back
          toUserId: poke.fromUserId, // poke sender becomes recipient
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        // Optionally update the poke list or navigate to chat if conversation is created
        // For example, if response.data.conversation is returned, navigate to it:
        if (response.data.conversation) {
          navigate(`/conversation/${response.data.conversation.id}`);
        } else {
          // refresh poke list, etc.
          alert("Poke back sent!");
        }
      })
      .catch((error) => {
        console.error("Error sending poke back", error);
      });
  };

  return (
    <>
      <h1>Poke Log</h1>
      <div>
        <h2>Incoming Pokes</h2>
        {pokes.length === 0 ? (
          <p>No new pokes received.</p>
        ) : (
          <ul>
            {pokes.map((poke) => (
              <li key={poke.id}>
                From: {poke.fromUserId}
                {poke.conversationId ? (
                  // If a conversation exists, allow chat
                  <button onClick={() => handleStartChat(poke.conversationId)}>
                    Chat
                  </button>
                ) : (
                  // Otherwise, allow the user to send a poke back
                  <button onClick={() => handlePokeBack(poke)}>
                    Poke Back
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2>Outgoing Pokes</h2>
        {outgoingPokes.length === 0 ? (
          <p>No pending pokes sent.</p>
        ) : (
          <ul>
            {outgoingPokes.map((poke) => (
              <li key={poke.id}>
                To: {poke.toUserId} – Status: {poke.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default PokeLog;
