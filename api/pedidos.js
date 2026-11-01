const crypto = require('crypto');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOkDOpLPTZdf9J3tPb7RYacfVidoRDIZkeTxlJBSgt6vLWzf1W2kGHns8FkZcridUahw/exec';
const SHIRT_PRICE_CENTS = 4500;
const BUTTON_MODELS = [
  ['botton_geracao', 'Geração em Chamas'],
  ['botton_album', 'Álbum da Cidade'],
  ['botton_nucleo', 'O Maior Núcleo da Bahia'],
  ['botton_grandoes', 'Grandões e Sem Medo'],
  ['botton_sol', 'Sol, Onda e Montanha'],
];
const SHIRT_KEYS = ['camisa_onda_p','camisa_onda_m','camisa_onda_g','camisa_onda_gg','camisa_onda_g1','camisa_onda_g2','camisa_onda_g3','camisa_ciclo_p','camisa_ciclo_m','camisa_ciclo_g','camisa_ciclo_gg','camisa_ciclo_g1','camisa_ciclo_g2','camisa_ciclo_g3'];
const SHIRT_LABELS = {
  camisa_onda_p:'A onda que vira fogo - P', camisa_onda_m:'A onda que vira fogo - M',
  camisa_onda_g:'A onda que vira fogo - G', camisa_onda_gg:'A onda que vira fogo - GG',
  camisa_onda_g1:'A onda que vira fogo - G1', camisa_onda_g2:'A onda que vira fogo - G2', camisa_onda_g3:'A onda que vira fogo - G3',
  camisa_ciclo_p:'O ciclo recomeça - P', camisa_ciclo_m:'O ciclo recomeça - M', camisa_ciclo_g:'O ciclo recomeça - G', camisa_ciclo_gg:'O ciclo recomeça - GG',
  camisa_ciclo_g1:'O ciclo recomeça - G1', camisa_ciclo_g2:'O ciclo recomeça - G2', camisa_ciclo_g3:'O ciclo recomeça - G3'
};

const BRAZILIAN_DDDS = new Set([
  '11','12','13','14','15','16','17','18','19','21','22','24','27','28','31','32','33','34','35','37','38',
  '41','42','43','44','45','46','47','48','49','51','53','54','55','61','62','63','64','65','66','67','68',
  '69','71','73','74','75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94','95',
  '96','97','98','99'
]);

class ValidationError extends Error {}

function invalid(message) { throw new ValidationError(message); }

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeName(value) {
  if (typeof value !== 'string') invalid('Informe um nome válido.');
  const name = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!name || name.length < 3 || name.length > 120) invalid('Informe um nome válido.');
  if (/[\u0000-\u001F\u007F-\u009F]/u.test(name)) invalid('Informe um nome válido.');
  if (!/\p{L}/u.test(name)) invalid('Informe um nome válido.');
  return name;
}

function normalizeCPF(value) {
  if (typeof value !== 'string') invalid('CPF inválido. Confira os números informados.');
  const cpfText = value.trim();
  if (!/^[\d.\-\s]+$/u.test(cpfText)) invalid('CPF inválido. Confira os números informados.');
  const cpf = cpfText.replace(/\D/g, '');
  if (!validCPF(cpf)) invalid('CPF inválido. Confira os números informados.');
  return cpf;
}

function normalizePhone(value) {
  if (typeof value !== 'string') invalid('Telefone inválido.');
  const phoneText = value.trim();
  if (!/^[\d()\-+\s]+$/u.test(phoneText)) invalid('Telefone inválido.');
  const phone = phoneText.replace(/\D/g, '');
  const ddd = phone.slice(0, 2);
  const subscriber = phone.slice(2);
  const validLength = phone.length === 10 || phone.length === 11;
  const validSubscriber = phone.length === 10 ? /^[2-5]\d{7}$/u.test(subscriber) : /^9\d{8}$/u.test(subscriber);
  if (!validLength || !BRAZILIAN_DDDS.has(ddd) || /^([0-9])\1+$/u.test(phone) || /^([0-9])\1+$/u.test(subscriber) || !validSubscriber) {
    invalid('Telefone inválido.');
  }
  return phone;
}

function normalizeQuantity(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0 || value > 999) invalid('Quantidade inválida.');
    return value;
  }
  if (typeof value === 'string' && /^\d+$/u.test(value)) {
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n > 999) invalid('Quantidade inválida.');
    return n;
  }
  invalid('Quantidade inválida.');
}

function validateProductObject(value, allowedKeys, fieldName) {
  if (value == null) return {};
  if (!isRecord(value)) invalid(`${fieldName} inválidos.`);
  const unknownKeys = Object.keys(value).filter(key => !allowedKeys.has(key));
  if (unknownKeys.length) invalid(`${fieldName} inválidos.`);
  return value;
}

function quantity(v) {
  return normalizeQuantity(v);
}
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
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11; if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11; if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}
function money(cents) { return (cents / 100).toFixed(2); }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const body = req.body || {};
    if (!isRecord(body) || !isRecord(body.customer)) invalid('Dados do cliente inválidos.');
    const customer = body.customer;
    const name = normalizeName(customer.name);
    const cpf = normalizeCPF(customer.cpf);
    const phone = normalizePhone(customer.phone);

    const shirts = {}; let shirtCount = 0;
    const shirtInput = validateProductObject(body.shirts, new Set(SHIRT_KEYS), 'Camisas');
    for (const key of SHIRT_KEYS) {
      shirts[key] = quantity(shirtInput[key] ?? 0);
      shirtCount += shirts[key];
    }
    const buttons = {}; let buttonCount = 0;
    const buttonKeys = new Set(BUTTON_MODELS.map(([key]) => key));
    const buttonInput = validateProductObject(body.buttons, buttonKeys, 'Bottons');
    for (const [key] of BUTTON_MODELS) {
      buttons[key] = quantity(buttonInput[key] ?? 0);
      buttonCount += buttons[key];
    }
    const buttonCents = priceButtons(buttonCount);
    const shirtCents = shirtCount * SHIRT_PRICE_CENTS;
    const totalCents = shirtCents + buttonCents;
    if (totalCents <= 0) invalid('O pedido precisa conter pelo menos um produto.');
    if (totalCents > 100000000) invalid('Valor do pedido fora do limite permitido.');

    const shirtSummary = SHIRT_KEYS.filter(k => shirts[k])
      .map(k => `${SHIRT_LABELS[k]}: ${shirts[k]}`).join(' | ') || '-';
    const buttonSummary = BUTTON_MODELS.filter(([k]) => buttons[k])
      .map(([k, label]) => `${label}: ${buttons[k]}`)
      .join(' | ') || '-';

    // O Apps Script espera os campos achatados; convertemos aqui os dados recebidos da loja.
    const orderId = `GER-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const appsScriptPayload = {
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

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(appsScriptPayload),
      redirect: 'follow'
    });
    const responseText = await response.text();
    let result;
    try { result = JSON.parse(responseText); }
    catch (_) { throw new Error('Resposta externa inválida.'); }

    if (!response.ok || result.sucesso !== true) {
      throw new Error('O registro externo não foi confirmado.');
    }

    return res.status(201).json({
      ok: true,
      orderId: result.pedido || orderId,
      total: totalCents / 100,
      paymentStatus: 'Aguardando pagamento'
    });
  } catch (error) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    console.error('Falha ao registrar pedido:', error && error.name ? error.name : 'Erro interno');
    return res.status(502).json({ error: 'Não foi possível registrar o pedido no momento.' });
  }
};

// O payload de pedidos é pequeno; limitar o parser reduz abuso antes da validação.
module.exports.config = { api: { bodyParser: { sizeLimit: '128kb' } } };
