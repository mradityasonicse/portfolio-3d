import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Play, Terminal, Database as DbIcon, AlertTriangle } from 'lucide-react';
import api from '../api/client';

const SAMPLE_QUERIES = [
  'SELECT * FROM projects ORDER BY id DESC LIMIT 10;',
  'SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10;',
  'SELECT * FROM portfolio_settings;',
  'SELECT name, type FROM sqlite_master WHERE type="table";',
  'SELECT COUNT(*) as total FROM projects;',
];

export default function Database() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef();

  async function runQuery() {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/api/admin/db-query', { query });
      setResult(data);
      toast.success(`Query executed · ${data.rowCount ?? 0} row(s)`);
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Query failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runQuery();
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Database Console</h1>
          <p className="page-subtitle">Execute raw SQL against your SQLite database</p>
        </div>
      </div>

      <div className="db-warning glass-card">
        <AlertTriangle size={16} />
        <p>Destructive queries (DROP, DELETE without WHERE) will affect live data. Be careful.</p>
      </div>

      <div className="db-layout">
        {/* Sample queries */}
        <div className="glass-card db-samples">
          <h3><DbIcon size={16} /> Sample Queries</h3>
          <ul>
            {SAMPLE_QUERIES.map((q, i) => (
              <li key={i}>
                <button className="sample-query-btn" onClick={() => setQuery(q)}>
                  {q.slice(0, 50)}{q.length > 50 ? '…' : ''}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Editor + results */}
        <div className="db-editor-col">
          <div className="glass-card db-editor-card">
            <div className="db-editor-header">
              <Terminal size={16} />
              <span>SQL Editor</span>
              <span className="db-hint">Ctrl+Enter to run</span>
            </div>
            <textarea
              ref={textareaRef}
              className="db-textarea"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              rows={8}
            />
            <div className="db-editor-footer">
              <button className="btn btn-primary" onClick={runQuery} disabled={running}>
                {running ? <span className="spinner-sm" /> : <Play size={16} />}
                {running ? 'Running…' : 'Run Query'}
              </button>
            </div>
          </div>

          {error && (
            <div className="db-error glass-card">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {result && (
            <div className="glass-card db-results">
              <div className="db-results-header">
                <span>Results</span>
                <span className="db-meta">{result.rowCount ?? 0} row(s) · {result.duration}ms</span>
              </div>
              {result.columns?.length > 0 ? (
                <div className="db-table-wrap">
                  <table className="data-table db-result-table">
                    <thead>
                      <tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {(result.rows ?? []).map((row, i) => (
                        <tr key={i}>
                          {result.columns.map((c) => (
                            <td key={c}>
                              <span title={String(row[c] ?? '')}>
                                {row[c] === null ? <em className="null-val">NULL</em> : String(row[c]).slice(0, 100)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="db-affected">{result.changes} row(s) affected</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
