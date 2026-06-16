import { useState } from 'react';
import { BarChart2, TrendingUp, Users, Eye } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Visitor & engagement insights</p>
        </div>
      </div>
      <div className="coming-soon glass-card">
        <BarChart2 size={56} />
        <h2>Analytics Dashboard</h2>
        <p>Track page views, visitor counts, and engagement metrics.<br />Full implementation in Phase 3.</p>
        <div className="feature-list">
          <div className="feature-item"><TrendingUp size={16} /> Page view tracking</div>
          <div className="feature-item"><Users size={16} /> Unique visitor counts</div>
          <div className="feature-item"><Eye size={16} /> Most viewed sections</div>
        </div>
      </div>
    </div>
  );
}
