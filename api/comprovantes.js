const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOkDOpLPTZdf9J3tPb7RYacfVidoRDIZkeTxlJBSgt6vLWzf1W2kGHns8FkZcridUahw/exec';
const MAX_BYTES = 3 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  try {
    const body = req.body || {};
    const orderId = String(body.orderId || '').trim();
    const fileName = String(body.fileName || 'comprovante').replace(/[\\/\\:*?"<>|\x00-\x1f]/g, '_').slice(0, 120);
    const mimeType = String(body.mimeType || '').toLowerCase();
    const dataUrl = String(body.dataUrl || '');
    if (!/^GER-\d{8}-[A-F0-9]{6}$/.test(orderId)) throw new Error('Número do pedido inválido.');
    if (!MIME_TYPES.has(mimeType)) throw new Error('Formato não permitido. Envie JPG, PNG ou PDF.');
    const match = dataUrl.match(/^data:(image\/jpeg|image\/png|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[1] !== mimeType) throw new Error('Arquivo inválido. Selecione novamente o comprovante.');
    const base64 = match[2];
    const estimatedBytes = Math.floor(base64.length * 3 / 4);
    if (estimatedBytes <= 0 || estimatedBytes > MAX_BYTES) throw new Error('O arquivo ultrapassa o limite de 3 MB.');

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'uploadReceipt', orderId, fileName, mimeType, base64 }),
      redirect: 'follow'
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch (_) { throw new Error('O Apps Script não retornou uma confirmação válida.'); }
    if (!response.ok || result.sucesso !== true) throw new Error(result.mensagem || 'O Apps Script não confirmou o envio.');
    return res.status(200).json({ ok: true, message: 'Comprovante enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar comprovante:', error);
    const message = error.message || 'Não foi possível enviar o comprovante.';
    return res.status(400).json({ ok: false, error: message });
  }
};
