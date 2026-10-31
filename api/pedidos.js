const crypto = require('crypto');

const SHIRT_PRICE_CENTS = 4500;
const BUTTON_MODELS = [
  ['botton_geracao', 'Geração em Chamas'],
  ['botton_album', 'Álbum da Cidade'],
  ['botton_nucleo', 'O Maior Núcleo da Bahia'],
  ['botton_grandoes', 'Grandões e Sem Medo'],
  ['botton_sol', 'Sol, Onda e Montanha'],
];
const SHIRT_KEYS = ['camisa_onda_p','camisa_onda_m','camisa_onda_g','camisa_onda_gg','camisa_ciclo_m','camisa_ciclo_g','camisa_ciclo_gg'];
const SHIRT_LABELS = {
  camisa_onda_p:'A onda que vira fogo - P', camisa_onda_m:'A onda que vira fogo - M',
  camisa_onda_g:'A onda que vira fogo - G', camisa_onda_gg:'A onda que vira fogo - GG',
  camisa_ciclo_m:'O ciclo recomeça - M', camisa_ciclo_g:'O ciclo recomeça - G', camisa_ciclo_gg:'O ciclo recomeça - GG'
};
function quantity(v) { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error('Quantidade inválida.'); return n; }
function priceButtons(q) {
  const dp = Array(q + 1).fill(Infinity); dp[0] = 0;
  for (let n = 1; n <= q; n++) {
    dp[n] = dp[n - 1] + 600;
    if (n >= 3) dp[n] = Math.min(dp[n], dp[n - 3] + 1500);
    if (n >= 5) dp[n] = Math.min(dp[n], dp[n - 5] + 2300);
  }
  return dp[q];
}
function validCPF(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11; if (digit === 10) digit = 0; if (digit !== Number(cpf[9])) return false;
  sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11; if (digit === 10) digit = 0; return digit === Number(cpf[10]);
}
function escapeSheet(value) { return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 5000); }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const body = req.body || {};
    const customer = body.customer || {};
    const name = String(customer.name || '').trim();
    const cpf = String(customer.cpf || '').replace(/\D/g, '');
    const phone = String(customer.phone || '').replace(/\D/g, '');
    if (name.length < 3 || name.length > 120) throw new Error('Informe um nome válido.');
    if (!validCPF(cpf)) throw new Error('CPF inválido. Confira os números informados.');
    if (phone.length < 10 || phone.length > 11) throw new Error('Telefone inválido.');

    const shirts = {}; let shirtCount = 0;
    for (const key of SHIRT_KEYS) { shirts[key] = quantity((body.shirts || {})[key] ?? 0); shirtCount += shirts[key]; }
    const buttons = {}; let buttonCents = 0;
    for (const [key] of BUTTON_MODELS) { buttons[key] = quantity((body.buttons || {})[key] ?? 0); buttonCents += priceButtons(buttons[key]); }
    const shirtCents = shirtCount * SHIRT_PRICE_CENTS;
    const totalCents = shirtCents + buttonCents;
    if (totalCents <= 0) throw new Error('O pedido precisa conter pelo menos um produto.');
    if (totalCents > 100000000) throw new Error('Valor do pedido fora do limite permitido.');

    // O Apps Script grava na aba Pedidos. A chamada ocorre no servidor da Vercel,
    // portanto a URL do Google não precisa ser chamada diretamente pelo navegador.
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyOkDOpLPTZdf9J3tPb7RYacfVidoRDIZkeTxlJBSgt6vLWzf1W2kGHns8FkZcridUahw/exec';
    const orderId = `GER-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const shirtSummary = SHIRT_KEYS.filter(k => shirts[k]).map(k => `${SHIRT_LABELS[k]}: ${shirts[k]}`).join(' | ') || '-';
    const buttonSummary = BUTTON_MODELS.filter(([k]) => buttons[k]).map(([k,label]) => `${label}: ${buttons[k]} (R$ ${(priceButtons(buttons[k])/100).toFixed(2).replace('.',',')})`).join(' | ') || '-';

    const scriptPayload = {
      orderId,
      name,
      cpf,
      phone,
      shirtsDetail: shirtSummary,
      shirtQty: shirtCount,
      buttonsDetail: buttonSummary,
      shirtsSubtotal: shirtCents / 100,
      buttonsSubtotal: buttonCents / 100,
      total: totalCents / 100
    };

    const scriptResponse = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptPayload),
      redirect: 'follow'
    });
    const responseText = await scriptResponse.text();
    let scriptResult;
    try {
      scriptResult = JSON.parse(responseText);
    } catch (_) {
      throw new Error('O Google Apps Script não retornou uma confirmação válida.');
    }
    if (!scriptResponse.ok || scriptResult.sucesso !== true) {
      throw new Error(scriptResult.mensagem || 'O Google Apps Script não confirmou o registro do pedido.');
    }

    return res.status(201).json({ ok: true, orderId, total: totalCents / 100, paymentStatus: 'Aguardando pagamento' });
  } catch (error) {
    console.error('Erro ao registrar pedido:', error);
    const message = error.message || 'Não foi possível registrar o pedido.';
    const status = /CPF|Telefone|nome|Quantidade|pedido precisa|Valor do pedido/.test(message) ? 400 : 500;
    return res.status(status).json({ error: status === 500 ? 'Não foi possível registrar o pedido agora. Tente novamente mais tarde.' : message });
  }
};
