// Controle de estoque de camisas.
// O estoque é compartilhado entre os dois modelos: cada tamanho tem um limite total.
// Persistência: Upstash Redis (Vercel Marketplace → Upstash Redis), via REST, com reserva atômica.
// Variáveis aceitas: KV_REST_API_URL/KV_REST_API_TOKEN ou UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.

const STOCK_LIMITS = { p: 4, m: 4, g: 1, gg: 1, g1: 0, g2: 0, g3: 0 };
const SIZES = Object.keys(STOCK_LIMITS);
const HASH_KEY = 'lojinha:estoque:vendido';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Fallback em memória (apenas para desenvolvimento; NÃO é confiável na Vercel).
const memory = Object.fromEntries(SIZES.map(s => [s, 0]));

function persistent() { return Boolean(REDIS_URL && REDIS_TOKEN); }

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error('Falha no armazenamento de estoque.');
  return data.result;
}

async function getSold() {
  if (!persistent()) return { ...memory };
  const flat = (await redis(['HGETALL', HASH_KEY])) || [];
  const sold = Object.fromEntries(SIZES.map(s => [s, 0]));
  for (let i = 0; i < flat.length; i += 2) if (flat[i] in sold) sold[flat[i]] = Number(flat[i + 1]) || 0;
  return sold;
}

async function getStock() {
  const sold = await getSold();
  const stock = {};
  for (const s of SIZES) {
    const limit = STOCK_LIMITS[s];
    stock[s] = { limit, sold: Math.min(sold[s], limit), left: Math.max(0, limit - sold[s]) };
  }
  return stock;
}

// Reserva atômica: tudo ou nada. `want` = { p: 2, m: 1, ... }. Retorna true se reservou.
const RESERVE_LUA = `
for i = 1, #ARGV, 3 do
  local sold = tonumber(redis.call('HGET', KEYS[1], ARGV[i]) or '0')
  if sold + tonumber(ARGV[i+1]) > tonumber(ARGV[i+2]) then return 0 end
end
for i = 1, #ARGV, 3 do redis.call('HINCRBY', KEYS[1], ARGV[i], ARGV[i+1]) end
return 1`;

async function reserve(want) {
  const entries = SIZES.filter(s => want[s] > 0);
  if (!entries.length) return true;
  if (!persistent()) {
    if (entries.some(s => memory[s] + want[s] > STOCK_LIMITS[s])) return false;
    entries.forEach(s => { memory[s] += want[s]; });
    return true;
  }
  // ARGV em trincas: tamanho, quantidade, limite
  const args = entries.flatMap(s => [s, String(want[s]), String(STOCK_LIMITS[s])]);
  return (await redis(['EVAL', RESERVE_LUA, '1', HASH_KEY, ...args])) === 1;
}

async function release(want) {
  const entries = SIZES.filter(s => want[s] > 0);
  if (!persistent()) { entries.forEach(s => { memory[s] = Math.max(0, memory[s] - want[s]); }); return; }
  for (const s of entries) await redis(['HINCRBY', HASH_KEY, s, String(-want[s])]);
}

module.exports = { STOCK_LIMITS, SIZES, getStock, reserve, release, persistent };
