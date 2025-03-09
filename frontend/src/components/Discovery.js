import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../Constants";

function Discovery() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `${BACKEND_URL}/users/nearby?lat=${latitude}&lng=${longitude}&radius=5000`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Optionally filter out users already poked or in conversation with userId
          setUsers(response.data.users);
        } catch (error) {
          console.error("Error fetching nearby users", error);
        }
      });
    }
  }, [token]);

  const handlePoke = async (targetUserId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/poke`,
        { fromUserId: userId, toUserId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Poke sent!");
    } catch (error) {
      console.error("Error sending poke", error);
    }
  };

  return (
    <div>
      <h1>Discover People Near You</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.bio}
            <button onClick={() => handlePoke(user.id)}>Poke</button>
          </li>
        ))}
      </ul>
      {/* You can add a bottom tab component here for switching between chats and pokelist */}
    </div>
  );
}

export default Discovery;
