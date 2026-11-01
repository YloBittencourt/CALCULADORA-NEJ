const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOkDOpLPTZdf9J3tPb7RYacfVidoRDIZkeTxlJBSgt6vLWzf1W2kGHns8FkZcridUahw/exec';
const MAX_BYTES = 3 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
class ValidationError extends Error {}
function invalid(message) { throw new ValidationError(message); }

function decodeBase64(value) {
  if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) {
    invalid('Arquivo inválido. Selecione novamente o comprovante.');
  }
  const buffer = Buffer.from(value, 'base64');
  if (!buffer.length) invalid('Arquivo vazio. Selecione novamente o comprovante.');
  return buffer;
}

function matchesSignature(buffer, mimeType) {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF && buffer[buffer.length - 2] === 0xFF && buffer[buffer.length - 1] === 0xD9;
  }
  if (mimeType === 'image/png') {
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdr = Buffer.from('IHDR', 'ascii');
    const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    return buffer.length >= 33 && signature.equals(buffer.subarray(0, 8)) && buffer.readUInt32BE(8) === 13 && ihdr.equals(buffer.subarray(12, 16)) && buffer.readUInt32BE(16) > 0 && buffer.readUInt32BE(20) > 0 && buffer.subarray(-12).equals(iend);
  }
  if (mimeType === 'application/pdf') {
    const eof = Buffer.from('%%EOF', 'ascii');
    return buffer.length >= 10 && buffer.subarray(0, 5).toString('ascii') === '%PDF-' && buffer.lastIndexOf(eof) >= Math.max(5, buffer.length - 1024);
  }
  return false;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  try {
    const body = req.body || {};
    const orderId = String(body.orderId || '').trim();
    const fileName = String(body.fileName || 'comprovante').replace(/[\\/\\:*?"<>|\x00-\x1f]/g, '_').slice(0, 120);
    const mimeType = String(body.mimeType || '').toLowerCase();
    const dataUrl = String(body.dataUrl || '');
    if (!/^GER-\d{8}-[A-F0-9]{6}$/.test(orderId)) invalid('Número do pedido inválido.');
    if (!MIME_TYPES.has(mimeType)) invalid('Formato não permitido. Envie JPG, PNG ou PDF.');
    const match = dataUrl.match(/^data:(image\/jpeg|image\/png|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[1] !== mimeType) invalid('Arquivo inválido. Selecione novamente o comprovante.');
    const base64 = match[2];
    const buffer = decodeBase64(base64);
    if (buffer.length > MAX_BYTES) invalid('O arquivo ultrapassa o limite de 3 MB.');
    if (!matchesSignature(buffer, mimeType)) invalid('O conteúdo do arquivo não corresponde ao formato informado.');

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'uploadReceipt', orderId, fileName, mimeType, base64 }),
      redirect: 'follow'
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch (_) { throw new Error('Resposta externa inválida.'); }
    if (!response.ok || result.sucesso !== true) throw new Error('O envio externo não foi confirmado.');
    return res.status(200).json({ ok: true, message: 'Comprovante enviado com sucesso.' });
  } catch (error) {
    if (error instanceof ValidationError) return res.status(400).json({ ok: false, error: error.message });
    console.error('Falha ao enviar comprovante:', error && error.name ? error.name : 'Erro interno');
    return res.status(502).json({ ok: false, error: 'Não foi possível enviar o comprovante no momento.' });
  }
};

// Mantém o corpo máximo compatível com um arquivo decodificado de até 3 MB,
// considerando a expansão do base64 e o envelope JSON enviado pelo frontend.
module.exports.config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
