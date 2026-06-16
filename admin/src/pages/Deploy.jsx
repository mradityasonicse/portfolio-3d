import { Rocket, Github, Globe, CheckCircle } from 'lucide-react';

export default function Deploy() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deployment</h1>
          <p className="page-subtitle">Railway deployment & environment config</p>
        </div>
      </div>
      <div className="coming-soon glass-card">
        <Rocket size={56} />
        <h2>Deployment Center</h2>
        <p>Manage your Railway deployment from this panel.<br />Full implementation in Phase 4.</p>
        <div className="feature-list">
          <div className="feature-item"><CheckCircle size={16} /> One-click deploy to Railway</div>
          <div className="feature-item"><Github size={16} /> Git integration & auto-deploy</div>
          <div className="feature-item"><Globe size={16} /> Custom domain management</div>
        </div>
        <a href="https://railway.app" target="_blank" rel="noopener" className="btn btn-primary mt-4">
          Open Railway Dashboard
        </a>
      </div>
    </div>
  );
}
