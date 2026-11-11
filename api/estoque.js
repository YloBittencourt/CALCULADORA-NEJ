const { getStock, resetStock, setSold, persistent } = require('./_estoque');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      return res.status(200).json({ ok: true, stock: await getStock(), persistent: persistent() });
    } catch (error) {
      console.error('Falha ao consultar estoque:', error);
      return res.status(502).json({ error: 'Não foi possível consultar o estoque.' });
    }
  }

  // Ações administrativas opcionais via POST (para reposição ou cancelamentos)
  if (req.method === 'POST') {
    const adminToken = process.env.ADMIN_TOKEN;
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'] || req.query?.token;

    if (!adminToken || token !== adminToken) {
      return res.status(401).json({ error: 'Não autorizado. Configure ADMIN_TOKEN para gerenciar o estoque.' });
    }

    try {
      const { action, size, sold } = req.body || {};
      if (action === 'reset') {
        await resetStock();
        return res.status(200).json({ ok: true, message: 'Estoque resetado com sucesso.', stock: await getStock() });
      }
      if (action === 'set' && size) {
        await setSold(size, sold);
        return res.status(200).json({ ok: true, message: `Quantidade vendida de ${size} atualizada para ${sold}.`, stock: await getStock() });
      }
      return res.status(400).json({ error: 'Ação inválida. Use action="reset" ou action="set".' });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Erro ao processar alteração.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
};

