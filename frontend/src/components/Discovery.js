// Discovery.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../Constants";

const Discovery = () => {
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
          // Filter logic: exclude users that the current user has already poked
          // and users with incomplete profiles (this filtering can also be done on the backend)
          //   const filtered = response.data.users.filter(
          //     (u) => u.id !== userId && u.name && u.bio && u.photoUrl
          //   );

          setUsers(response.data.users);
        } catch (error) {
          console.error("Error fetching nearby users", error);
        }
      });
    }
  }, [token, userId]);

  const handlePoke = async (targetUserId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/poke`,
        { fromUserId: userId, toUserId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Poke sent!");
      // Optionally remove the user from the list so they aren't shown again
      setUsers((prev) => prev.filter((user) => user.id !== targetUserId));
    } catch (error) {
      console.error("Error sending poke", error);
    }
  };

  return (
    <div>
      <h1>Discover People Near You</h1>
      <div className="cards-container">
        {users.map((user) => (
          <div key={user.id} className="card">
            <img
              src={user.photoUrl || "default-avatar.png"}
              alt={user.name}
              style={{ width: "80vw" }}
            />
            <h2>{user.name}</h2>
            <p>{user.bio}</p>
            <button onClick={() => handlePoke(user.id)}>Poke</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discovery;
