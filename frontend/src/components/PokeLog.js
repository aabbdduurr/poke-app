import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";
import "./PokeLog.css"; // Import the CSS

const PokeLog = () => {
  const [pokes, setPokes] = useState([]);
  const [outgoingPokes, setOutgoingPokes] = useState([]);
  const [reciprocatedPokes, setReciprocatedPokes] = useState([]);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch incoming pending pokes
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/pokes/incoming?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setPokes(response.data.pokes))
      .catch((error) => console.error("Error fetching incoming pokes", error));
  }, [token, userId]);

  // Fetch outgoing pending pokes
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/pokes/outgoing?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setOutgoingPokes(response.data.pokes))
      .catch((error) => console.error("Error fetching outgoing pokes", error));
  }, [token, userId]);

  // Fetch reciprocated pokes (status accepted)
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/pokes/reciprocated?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setReciprocatedPokes(response.data.pokes))
      .catch((error) =>
        console.error("Error fetching reciprocated pokes", error)
      );
  }, [token, userId]);

  const handleStartChat = (conversationId) => {
    navigate(`/conversation/${conversationId}`);
  };

  const handlePokeBack = (poke) => {
    axios
      .post(
        `${BACKEND_URL}/poke`,
        {
          fromUserId: userId, // current user pokes back
          toUserId: poke.fromUserId, // original sender becomes recipient
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        alert("Poke back sent!");
      })
      .catch((error) => {
        console.error("Error sending poke back", error);
      });
  };

  return (
    <div className="pokelog-container">
      <h1 className="pokelog-title">Poke Log</h1>

      <div className="pokelog-section">
        <h2>Incoming Pokes</h2>
        {pokes.length === 0 ? (
          <p>No new pokes received.</p>
        ) : (
          <ul className="pokelog-list">
            {pokes.map((poke) => (
              <li key={poke.id} className="pokelog-item">
                <div className="pokelog-sender">
                  From: {poke.senderName || poke.fromUserId}
                </div>
                {!poke.conversationId ? (
                  <button
                    className="pokelog-button"
                    onClick={() => handlePokeBack(poke)}
                  >
                    Poke Back
                  </button>
                ) : (
                  <button
                    className="pokelog-button"
                    onClick={() => handleStartChat(poke.conversationId)}
                  >
                    Chat
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="pokelog-section">
        <h2>Outgoing Pokes</h2>
        {outgoingPokes.length === 0 ? (
          <p>No pending pokes sent.</p>
        ) : (
          <ul className="pokelog-list">
            {outgoingPokes.map((poke) => (
              <li key={poke.id} className="pokelog-item">
                To: {poke.toUserId} – Status: {poke.status}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* <div className="pokelog-section">
            
            <h2>Reciprocated Pokes</h2>
            {reciprocatedPokes.length === 0 ? (
            <p>No reciprocated pokes.</p>
            ) : (
             <ul className="pokelog-list">
                {reciprocatedPokes.map((poke) => (
                <li key={poke.id} className="pokelog-item">
                    {poke.fromUserId === userId ? (
                    <>
                        You poked {poke.toUserId} –{" "}
                        <button
                        className="pokelog-button"
                        onClick={() =>
                            handleStartChat(poke.conversationId || poke.id)
                        }
                        >
                        Start Chat
                        </button>
                    </>
                    ) : (
                    <>From {poke.fromUserId} – Not your turn</>
                    )}
                </li>
                ))}
            </ul>
            )}
        </div> */}
    </div>
  );
};

export default PokeLog;
