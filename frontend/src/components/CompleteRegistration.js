// CompleteRegistration.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";

function CompleteRegistration() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // Ensure all fields are filled
    if (!name || !bio || !photoUrl) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      await axios.post(
        `${BACKEND_URL}/update-profile`,
        { name, bio, photoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/app/discovery");
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };

  return (
    <div>
      <h1>Complete Your Profile</h1>
      <form onSubmit={handleUpdateProfile}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Your Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Photo URL"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          required
        />
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}

export default CompleteRegistration;
