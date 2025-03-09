import React, { useState, useEffect } from "react";
import axios from "axios";

function Discovery() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Get current geolocation and fetch nearby users
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `${BACKEND_URL}/users/nearby?lat=${latitude}&lng=${longitude}&radius=5000`
          );
          setUsers(response.data.users);
        } catch (error) {
          console.error("Error fetching nearby users", error);
        }
      });
    }
  }, []);

  const handlePoke = async (userId) => {
    try {
      // Assuming the logged-in user's id is managed in your state/auth logic
      const fromUserId = "current-user-id";
      await axios.post(`${BACKEND_URL}/poke`, {
        fromUserId,
        toUserId: userId,
      });
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
    </div>
  );
}

export default Discovery;
