import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODULES_CONFIG } from '../config/modules';
import { User, LogOut, ChevronRight, X } from 'lucide-react';

const SideDrawer = ({ isOpen, onClose }) => {
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentModule = searchParams.get('module') || 'overview';

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile(user);
      }
    };
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate('/admin');
  };

  const handleNavigate = (moduleId) => {
    setSearchParams({ module: moduleId });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Menu</h2>
          <button onClick={onClose} className="icon-btn" style={{ color: 'var(--text-primary)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              <User size={24} />
            </div>
            <div className="profile-info">
              <div className="profile-greeting">Welcome,</div>
              <div className="profile-name">Admin</div>
              <div className="profile-email">{userProfile?.email || 'admin@aadityaindustries.com'}</div>
            </div>
          </div>

          <div className="modules-label">MAIN MODULES</div>

          {/* Modules List */}
          <div className="modules-list">
            {MODULES_CONFIG.map((mod) => {
              const IconComponent = mod.icon;
              const isActive = currentModule === mod.id;
              return (
                <div 
                  key={mod.id} 
                  className={`module-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(mod.id)}
                >
                  <div className="module-icon">
                    <IconComponent size={18} color={isActive ? 'white' : mod.color} />
                  </div>
                  <div className="module-label">
                    {mod.label}
                  </div>
                  <ChevronRight size={18} color={isActive ? 'white' : "#cbd5e1"} />
                </div>
              )
            })}
          </div>
        </div>

        <div className="drawer-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
