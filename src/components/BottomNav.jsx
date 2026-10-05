import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const currentModule = searchParams.get('module') || 'overview';
  const initialIndex = NAV_ITEMS.findIndex(item => item.id === currentModule);
  const [hoverIndex, setHoverIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state when URL search params change
  useEffect(() => {
    const idx = NAV_ITEMS.findIndex(item => item.id === currentModule);
    if (idx >= 0 && !isDragging) {
      setHoverIndex(idx);
    }
  }, [currentModule, isDragging]);

  const getIndexFromX = (clientX) => {
    if (!containerRef.current) return hoverIndex;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const widthPerTab = rect.width / NAV_ITEMS.length;
    return Math.min(
      NAV_ITEMS.length - 1,
      Math.max(0, Math.floor(touchX / widthPerTab))
    );
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const targetIdx = getIndexFromX(e.clientX);
    setHoverIndex(targetIdx);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const targetIdx = getIndexFromX(e.clientX);
    if (targetIdx !== hoverIndex) {
      setHoverIndex(targetIdx);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const finalIdx = getIndexFromX(e.clientX);
    const targetItem = NAV_ITEMS[finalIdx];
    if (targetItem) {
      navigate(targetItem.path);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      const targetIdx = getIndexFromX(e.touches[0].clientX);
      setHoverIndex(targetIdx);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    const targetIdx = getIndexFromX(e.touches[0].clientX);
    if (targetIdx !== hoverIndex) {
      setHoverIndex(targetIdx);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const targetItem = NAV_ITEMS[hoverIndex];
    if (targetItem) {
      navigate(targetItem.path);
    }
  };

  const handleItemClick = (item, idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setHoverIndex(idx);
    navigate(item.path);
  };

  return (
    <nav className="ios-bottom-nav">
      <div
        ref={containerRef}
        className="ios-nav-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ userSelect: 'none', touchAction: 'none' }}
      >
        {NAV_ITEMS.map((item, idx) => {
          const isActive = hoverIndex === idx;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(item, idx, e)}
              className={`ios-nav-item ${isActive ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              {isActive && (
                <motion.div
                  layoutId="iosActiveIndicator"
                  className="ios-active-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <motion.div
                className="ios-nav-content"
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={20} color={isActive ? "#ffffff" : "#64748b"} />
                <span style={{ color: isActive ? "#ffffff" : "#64748b" }}>{item.label}</span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
