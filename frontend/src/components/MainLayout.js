// MainLayout.js
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./MainLayout.css"; // See provided CSS below

const MainLayout = () => {
  return (
    <div className="layout-container">
      <div className="content">
        <Outlet />
      </div>
      <div className="tab-bar">
        <NavLink to="/app/discovery" className="tab" activeclassname="active">
          Discover
        </NavLink>
        <NavLink to="/app/pokelog" className="tab" activeclassname="active">
          Poke Log
        </NavLink>
        <NavLink to="/app/chats" className="tab" activeclassname="active">
          Chats
        </NavLink>
      </div>
    </div>
  );
};

export default MainLayout;
