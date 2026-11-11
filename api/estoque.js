const { getStock } = require('./_estoque');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    return res.status(200).json({ ok: true, stock: await getStock() });
  } catch (error) {
    console.error('Falha ao consultar estoque');
    return res.status(502).json({ error: 'Não foi possível consultar o estoque.' });
  }
};

