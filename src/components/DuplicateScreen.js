import React from 'react';

export function DuplicateScreen({ match, newPhotoUrl, onConfirm, onFalsePositive }) {
  const sim = Math.round((1 - match.distance) * 100);

  return (
    <>
      <div className="alert alert-warning">
        <div className="alert-title">⚠️ Possível participante repetido</div>
        <p>O sistema identificou semelhança com um cadastro existente. Confirme olhando as fotos abaixo.</p>
      </div>

      <div className="sim-wrap">
        <div className="sim-label">
          <span>Similaridade detectada</span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{sim}%</span>
        </div>
        <div className="sim-track">
          <div className="sim-fill" style={{ width: `${sim}%` }} />
        </div>
      </div>

      <div className="photo-compare">
        <div className="photo-col">
          <img src={match.participant.foto_url} alt="Cadastrada" />
          <p className="photo-label">📋 Cadastrada</p>
          <p className="photo-name">{match.participant.nome}</p>
        </div>
        <div className="photo-col">
          <img src={newPhotoUrl} alt="Agora" />
          <p className="photo-label">📷 Agora</p>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, margin: '4px 0 14px' }}>
        É a mesma pessoa?
      </p>

      <div className="action-row">
        <button className="btn btn-danger" onClick={onConfirm}>✅ Sim, já participou</button>
        <button className="btn btn-success" onClick={onFalsePositive}>❌ Não, liberar cadastro</button>
      </div>
    </>
  );
}
