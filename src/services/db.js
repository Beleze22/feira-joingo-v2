import supabase from './supabase';

const BUCKET = 'fotos-participantes';
const THRESHOLD = parseFloat(process.env.REACT_APP_FACE_THRESHOLD || '0.5');

// ─── Distância euclidiana (mesma usada pelo face-api) ────────────────────────
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// ─── Busca todos os participantes e compara descritores localmente ────────────
// Roda 100% no browser — sem round-trip para backend
export async function checkDescriptor(descriptor) {
  const { data: participants, error } = await supabase
    .from('participantes')
    .select('id, nome, email, foto_url, descriptor, total_participacoes');

  if (error) throw new Error('Erro ao buscar participantes: ' + error.message);

  let best = null;
  let bestDist = Infinity;

  for (const p of participants) {
    if (!p.descriptor || !Array.isArray(p.descriptor)) continue;
    const dist = euclideanDistance(descriptor, p.descriptor);
    if (dist < THRESHOLD && dist < bestDist) {
      bestDist = dist;
      best = { participant: p, distance: dist };
    }
  }

  return best
    ? { match: true, distance: best.distance, participant: best.participant }
    : { match: false };
}

// ─── Cadastra novo participante ───────────────────────────────────────────────
export async function registerParticipant({ formValues, photoDataUrl, descriptor }) {
  // 1. Converte data URL → Blob → File
  const blob = await fetch(photoDataUrl).then(r => r.blob());
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const file = new File([blob], fileName, { type: 'image/jpeg' });

  // 2. Upload da foto para o Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) throw new Error('Erro no upload da foto: ' + uploadError.message);

  // 3. Obtém URL pública
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  // 4. Insere no banco
  const { data, error: insertError } = await supabase
    .from('participantes')
    .insert([{
      nome:                formValues.nome.trim(),
      email:               formValues.email.trim().toLowerCase(),
      cpf:                 formValues.cpf || null,
      nascimento:          formValues.nascimento || null,
      telefone:            formValues.telefone || null,
      conhecia_joingo:     formValues.conhecia_joingo || null,
      foto_url:            publicUrl,
      foto_path:           fileName,
      descriptor:          Array.from(descriptor),
      total_participacoes: 1,
      ganhou_brinde:       true,
    }])
    .select()
    .single();

  if (insertError) throw new Error('Erro ao salvar dados: ' + insertError.message);
  return data;
}

// ─── Incrementa participações de quem voltou ─────────────────────────────────
export async function addParticipation(id) {
  const { data: current } = await supabase
    .from('participantes')
    .select('total_participacoes')
    .eq('id', id)
    .single();

  await supabase
    .from('participantes')
    .update({ total_participacoes: (current?.total_participacoes || 1) + 1 })
    .eq('id', id);
}

// ─── Lista participantes (aba de gestão) ─────────────────────────────────────
export async function listParticipants() {
  const { data, error } = await supabase
    .from('participantes')
    .select('id, nome, email, cpf, nascimento, telefone, conhecia_joingo, foto_url, total_participacoes, ganhou_brinde, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Exporta CSV no browser (sem backend) ────────────────────────────────────
export async function exportCSV() {
  const participants = await listParticipants();

  const headers = ['ID', 'Nome', 'E-mail', 'CPF', 'Nascimento', 'Telefone',
    'Conhecia JOINGO', 'Participações', 'Ganhou Brinde', 'Foto URL', 'Cadastrado em'];

  const rows = participants.map(p => [
    p.id,
    p.nome,
    p.email,
    p.cpf || '',
    p.nascimento || '',
    p.telefone || '',
    p.conhecia_joingo || '',
    p.total_participacoes,
    p.ganhou_brinde ? 'Sim' : 'Não',
    p.foto_url || '',
    new Date(p.created_at).toLocaleString('pt-BR'),
  ]);

  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(';')).join('\n');

  // BOM UTF-8 para Excel abrir corretamente
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `joingo-participantes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
