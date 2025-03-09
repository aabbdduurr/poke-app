import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Discovery from "./components/Discovery";
import Conversation from "./components/Conversation";
import CompleteRegistration from "./components/CompleteRegistration";

// A simple auth check component (in production, you may use a context or a more robust solution)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/complete-registration"
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discovery"
          element={
            <ProtectedRoute>
              <Discovery />
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
      </Routes>
    </Router>
  );
}

export default App;
