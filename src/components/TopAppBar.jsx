import React from 'react';
import { Menu, Bell } from 'lucide-react';

const TopAppBar = ({ toggleDrawer }) => {
  return (
    <header className="top-app-bar">
      <div className="top-app-bar-container">
        <button className="icon-btn" onClick={toggleDrawer}>
          <Menu size={24} color="white" />
        </button>

        <div className="top-app-bar-title-wrapper">
          <span className="top-app-bar-title">Aaditya Industries</span>

        </div>

        <button className="icon-btn">
          <Bell size={24} color="white" />
        </button>
      </div>
    </header>
  );
};

export default TopAppBar;
