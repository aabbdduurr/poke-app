import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Registration() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Create a FormData object to send the registration info
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("photo", photo);

    try {
      await axios.post(`${BACKEND_URL}/register`, formData);
      navigate("/discovery");
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div>
      <h1>Register for Poke</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setPhoto(e.target.files[0])}
          accept="image/*"
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Registration;
