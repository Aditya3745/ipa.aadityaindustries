import React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Package, Phone, PhoneCall, Scissors } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Home', icon: Home, path: '/admin/dashboard?module=overview' },
  { id: 'product', label: 'Products', icon: Package, path: '/admin/dashboard?module=product' },
  { id: 'seat_cutting', label: 'Cutting', icon: Scissors, path: '/admin/dashboard?module=seat_cutting' },
  { id: 'followup', label: 'Follow-up', icon: PhoneCall, path: '/admin/dashboard?module=followup' },
  { id: 'contact', label: 'Contact', icon: Phone, path: '/admin/dashboard?module=contact' },
];

const BottomNav = () => {
  const [searchParams] = useSearchParams();
  const currentModule = searchParams.get('module') || 'overview';

  return (
    <nav className="ios-bottom-nav">
      <div className="ios-nav-container">
        {NAV_ITEMS.map((item) => {
          const isActive = currentModule === item.id;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`ios-nav-item ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="iosActiveIndicator"
                  className="ios-active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                className="ios-nav-content"
                animate={{ scale: isActive ? 1.06 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={20} color={isActive ? "#ffffff" : "#64748b"} />
                <span style={{ color: isActive ? "#ffffff" : "#64748b" }}>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
