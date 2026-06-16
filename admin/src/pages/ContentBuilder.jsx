import { Layout, Layers, Type, Image, Code } from 'lucide-react';

export default function ContentBuilder() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Builder</h1>
          <p className="page-subtitle">Section ordering, hero content, and rich text editing</p>
        </div>
      </div>
      <div className="coming-soon glass-card">
        <Layout size={56} />
        <h2>Visual Content Builder</h2>
        <p>Drag-and-drop section reordering, WYSIWYG hero editing,<br />and rich text sections. Full implementation in Phase 2.</p>
        <div className="feature-list">
          <div className="feature-item"><Layers size={16} /> Section drag-and-drop reordering</div>
          <div className="feature-item"><Type size={16} /> TipTap WYSIWYG editor</div>
          <div className="feature-item"><Image size={16} /> Hero image & text controls</div>
          <div className="feature-item"><Code size={16} /> Custom HTML blocks</div>
        </div>
      </div>
    </div>
  );
}
