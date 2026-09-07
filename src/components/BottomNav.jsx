import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, Phone } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        <NavLink 
          to="/" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink 
          to="/products" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Package size={24} />
          <span>Products</span>
        </NavLink>
        <a 
          href="#contact" 
          className="bottom-nav-item"
        >
          <Phone size={24} />
          <span>Contact</span>
        </a>
      </div>
    </nav>
  );
};

export default BottomNav;
