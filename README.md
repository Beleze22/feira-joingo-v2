# 🎪 JOINGO Feira v2 — Frontend Only

Sistema de participação com reconhecimento facial.
**Sem backend** — tudo roda no browser, dados no Supabase direto.

---

## Estrutura

```
joingo-v2/
├── public/index.html
├── src/
│   ├── App.js                  ← máquina de estados do fluxo
│   ├── styles.css
│   ├── components/
│   │   ├── CameraView.js       ← câmera + detecção facial
│   │   ├── DuplicateScreen.js  ← comparação de fotos
│   │   ├── RegisterForm.js     ← formulário de cadastro
│   │   └── ParticipantsTab.js  ← lista + exportar CSV
│   ├── hooks/
│   │   └── useFaceCamera.js    ← face-api + compatibilidade iPad
│   └── services/
│       ├── supabase.js         ← cliente singleton (anon key)
│       └── db.js               ← toda a lógica de dados
├── .env.example
├── supabase_setup.sql
└── package.json
```

---

## Setup em 3 passos

### 1. Supabase
1. Crie conta em [supabase.com](https://supabase.com)
2. Novo projeto → anote a **Project URL** e a **anon/public key**
   - Painel → Settings → API
3. SQL Editor → New query → cole `supabase_setup.sql` → **Run**

### 2. Configurar o projeto
```bash
cp .env.example .env
```
Edite o `.env`:
```
REACT_APP_SUPABASE_URL=https://SEU-PROJETO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key-aqui
REACT_APP_FACE_THRESHOLD=0.5
```

### 3. Rodar local / fazer deploy

**Local:**
```bash
npm install
npm start       # abre em http://localhost:3000
```

**Deploy (Vercel):**
1. Suba o projeto no GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as 3 variáveis de ambiente
4. Deploy → URL pronta para o iPad

---

## Exportar CSV

- **No app:** aba Participantes → botão ⬇️ Exportar CSV
  - Baixa direto no dispositivo, abre certinho no Excel (BOM UTF-8, separador `;`)
- **No Supabase:** SQL Editor → rode a query comentada no final do `supabase_setup.sql`

---

## Ajustar sensibilidade facial

| `FACE_THRESHOLD` | Comportamento |
|---|---|
| `0.4` | Mais restritivo — menos falsos positivos |
| `0.5` | Balanceado ✅ |
| `0.6` | Mais permissivo — pega mais duplicatas |

Altere no `.env` (local) ou nas variáveis de ambiente do Vercel.

---

## Por que só frontend?

- O reconhecimento facial já rodava no browser via `face-api.js`
- O Supabase JS SDK acessa banco e storage direto do frontend com a `anon key`
- Resultado: deploy único, sem servidor, sem cold start, resposta mais rápida
