// App.js
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import Login from "./components/Login";
import CompleteRegistration from "./components/CompleteRegistration";
import MainLayout from "./components/MainLayout";
import Discovery from "./components/Discovery";
import PokeLog from "./components/PokeLog";
import Chats from "./components/Chats";
import Conversation from "./components/Conversation";
import { BACKEND_URL } from "./Constants";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const location = useLocation();

  // Send location on every route change if user is authenticated.
  useEffect(() => {
    if (token && navigator.geolocation && userId) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        axios
          .post(
            `${BACKEND_URL}/update-location`,
            { userId, latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((error) => console.error("Location update failed", error));
      });
    }
  }, [token, userId, location]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      {/* Protected routes */}
      <Route
        path="/complete-registration"
        element={
          <ProtectedRoute>
            <CompleteRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversation/:conversationId"
        element={
          <ProtectedRoute>
            <Conversation />
          </ProtectedRoute>
        }
      />
      {/* All authenticated pages inside MainLayout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="discovery" element={<Discovery />} />
        <Route path="pokelog" element={<PokeLog />} />
        <Route path="chats" element={<Chats />} />
        <Route index element={<Navigate to="discovery" replace />} />
      </Route>
      {/* Redirect root to login if not authenticated, or to /app/discovery if authenticated */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/app/discovery" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
