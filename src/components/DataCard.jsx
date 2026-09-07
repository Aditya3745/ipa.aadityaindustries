import React from 'react';
import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';

const DataCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = '#3b82f6', 
  details = [], 
  status,
  statusColor,
  index = 0,
  action,
  onEdit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        {Icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: `${iconColor}15`, // 15% opacity
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={20} color={iconColor} />
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            margin: '0 0 0.25rem 0', 
            fontSize: '1rem', 
            color: '#0f172a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onEdit && (
              <button 
                onClick={onEdit}
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
            )}
            {status && (
              <div style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              backgroundColor: statusColor ? `${statusColor}15` : '#f1f5f9',
              color: statusColor || '#475569',
            }}>
              {status}
            </div>
            )}
          </div>
          {action && (
            <div>{action}</div>
          )}
        </div>
      </div>

      {/* Details List */}
      {details.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '1rem',
          marginTop: 'auto'
        }}>
          {details.map((detail, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {detail.label}
              </span>
              <span style={{ fontSize: '0.9rem', color: detail.color || '#1e293b', fontWeight: '500' }}>
                {detail.value || '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DataCard;
