import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, Phone, PhoneCall } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        <NavLink 
          to="/admin/dashboard?module=overview" 
          className={({ isActive }) => `bottom-nav-item ${window.location.search.includes('overview') ? 'active' : ''}`}
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink 
          to="/admin/dashboard?module=product" 
          className={({ isActive }) => `bottom-nav-item ${window.location.search.includes('product') ? 'active' : ''}`}
        >
          <Package size={24} />
          <span>Products</span>
        </NavLink>
        <NavLink 
          to="/admin/dashboard?module=followup" 
          className={({ isActive }) => `bottom-nav-item ${window.location.search.includes('followup') ? 'active' : ''}`}
        >
          <PhoneCall size={24} />
          <span>Follow-up</span>
        </NavLink>
        <NavLink 
          to="/admin/dashboard?module=contact" 
          className={({ isActive }) => `bottom-nav-item ${window.location.search.includes('contact') ? 'active' : ''}`}
        >
          <Phone size={24} />
          <span>Contact</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
