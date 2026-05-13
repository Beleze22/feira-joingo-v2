import React, { useState } from 'react';

export function RegisterForm({ photoUrl, onSubmit, onBack, loading }) {
  const [form, setForm] = useState({
    nome: '', email: '', cpf: '', nascimento: '', telefone: '', conhecia_joingo: '',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const formatCPF = v => v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  const formatPhone = v => v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2');

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) { alert('Nome e e-mail são obrigatórios.'); return; }
    onSubmit(form);
  }

  return (
    <>
      <div className="alert alert-success">
        <div className="alert-title">✅ Primeira participação!</div>
        <p>Preencha seus dados para participar e concorrer ao brinde.</p>
      </div>

      <div className="selfie-preview">
        <img src={photoUrl} alt="Sua selfie" />
        <p>Sua foto de participação</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Dados pessoais</div>

          <div className="form-group">
            <label className="field-required">Nome completo</label>
            <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome completo" required />
          </div>
          <div className="form-group">
            <label className="field-required">E-mail</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="form-group">
            <label>CPF</label>
            <input type="text" value={form.cpf} onChange={e => set('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
          </div>
          <div className="form-group">
            <label>Data de nascimento</label>
            <input type="date" value={form.nascimento} onChange={e => set('nascimento', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input type="tel" value={form.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="numeric" />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Sobre a JOINGO</div>
          <div className="form-group">
            <label>Já conhecia a JOINGO antes de hoje?</label>
            <select value={form.conhecia_joingo} onChange={e => set('conhecia_joingo', e.target.value)}>
              <option value="">Selecione...</option>
              <option value="sim_cliente">Sim, já sou cliente</option>
              <option value="sim_redes">Sim, vi nas redes sociais</option>
              <option value="sim_amigos">Sim, ouvi falar de amigos</option>
              <option value="nao">Não, conheci hoje na feira</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '⏳ Cadastrando...' : '🎁 Cadastrar e Participar'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={loading}>
          Voltar
        </button>
      </form>
    </>
  );
}
