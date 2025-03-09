// Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../Constants";

function Login() {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/login`, { phone });
      // For demo purposes, show the OTP (remove in production)
      window.alert(`OTP sent: ${response.data.otp}`);
      setOtpSent(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/verify-otp`, {
        phone,
        otp,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      // Navigate to discovery if profile is complete, otherwise complete registration.
      if (user.name.startsWith("User-") || !user.bio || !user.photoUrl) {
        navigate("/complete-registration");
      } else {
        navigate("/app/discovery");
      }
    } catch (error) {
      console.error("OTP verification failed", error);
    }
  };

  return (
    <div>
      <h1>Login to Poke</h1>
      {!otpSent ? (
        <form onSubmit={handleSendOtp}>
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
}

export default Login;
