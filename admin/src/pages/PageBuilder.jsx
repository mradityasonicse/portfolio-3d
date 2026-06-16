import { FileText, Plus, Pencil, Globe } from 'lucide-react';

export default function PageBuilder() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Page Builder</h1>
          <p className="page-subtitle">Create and manage custom pages</p>
        </div>
      </div>
      <div className="coming-soon glass-card">
        <FileText size={56} />
        <h2>Page Builder</h2>
        <p>Create fully custom pages with a visual block editor.<br />Full implementation in Phase 2.</p>
        <div className="feature-list">
          <div className="feature-item"><Plus size={16} /> Create custom pages</div>
          <div className="feature-item"><Pencil size={16} /> Visual block editor</div>
          <div className="feature-item"><Globe size={16} /> Custom URLs & SEO settings</div>
        </div>
      </div>
    </div>
  );
}
