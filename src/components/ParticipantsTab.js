import React, { useEffect, useState } from 'react';
import { listParticipants, exportCSV } from '../services/db';

export function ParticipantsTab() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listParticipants().then(setParticipants).finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    try { await exportCSV(); } finally { setExporting(false); }
  }

  if (loading) {
    return (
      <div className="inline-loading">
        <div className="spinner" />
        <p>Carregando participantes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="participants-header">
        <h3>Participantes</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="count-badge">{participants.length} cadastros</span>
          {participants.length > 0 && (
            <button className="export-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? '⏳' : '⬇️'} Exportar CSV
            </button>
          )}
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>Nenhum participante cadastrado ainda.</p>
        </div>
      ) : (
        participants.map(p => (
          <div key={p.id} className="participant-card">
            <img src={p.foto_url} alt={p.nome} />
            <div className="participant-info">
              <strong>{p.nome}</strong>
              <span className="p-email">{p.email}</span>
              <span className="p-date">
                {new Date(p.created_at).toLocaleString('pt-BR')} · {p.total_participacoes} participação(ões)
              </span>
            </div>
            <span className="prize-badge">🎁 Brinde</span>
          </div>
        ))
      )}
    </>
  );
}
