import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Discovery from "./components/Discovery";
import Conversation from "./components/Conversation";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/discovery" element={<Discovery />} />
        <Route
          path="/conversation/:conversationId"
          element={<Conversation />}
        />
      </Routes>
    </Router>
  );
}

export default App;
