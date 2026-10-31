# Lojinha Geração — site de pedidos

Versão inicial sem Tally. O site usa HTML/CSS/JS e uma função serverless da Vercel para validar e registrar pedidos no Google Planilhas.

## O que já está implementado
- Dados do cliente primeiro (nome, CPF e WhatsApp).
- Dois modelos de camisa a R$ 45,00, com seleção por tamanho.
- Cinco modelos de bottons.
- Preço dos bottons por modelo: unidade R$ 6, combo de 3 R$ 15, combo de 5 R$ 23; excedentes calculados a R$ 6 por unidade. A combinação de combos busca o menor preço para a quantidade selecionada.
- Revisão do pedido antes de confirmar.
- Validação de CPF e recálculo dos valores no servidor.
- Registro em uma nova linha da aba `Pedidos`.
- Status inicial `Aguardando pagamento`; Pix automático fica para uma etapa posterior.

## Criar a planilha
Crie uma planilha Google e uma aba chamada `Pedidos`. Na primeira linha, use estas colunas:

`Pedido | Data/hora | Nome | CPF | Telefone | Camisas (detalhe) | Qtde camisas | Bottons (detalhe) | Subtotal camisas | Subtotal bottons | Total | Pagamento | Status do pedido`

Compartilhe a planilha com o e-mail da conta de serviço do Google (permissão Editor).

## Credenciais Google
1. Em um projeto Google Cloud, ative a Google Sheets API.
2. Crie uma conta de serviço e gere uma chave JSON.
3. Copie o `client_email` e o `private_key` do JSON.
4. Na Vercel, configure estas Environment Variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email`
   - `GOOGLE_PRIVATE_KEY` = `private_key` (cole o valor inteiro; mantenha as quebras como `\n` se o painel pedir)
   - `GOOGLE_SHEET_ID` = ID da planilha, trecho entre `/d/` e `/edit` na URL
5. Faça redeploy depois de salvar as variáveis.

Não coloque a chave JSON no código, no repositório ou no navegador.

## Publicar na Vercel
Importe este projeto em um repositório Git conectado à Vercel ou envie os arquivos para o projeto Vercel existente. O `index.html` fica na raiz e a API em `api/pedidos.js`. A Vercel instalará `googleapis` com base no `package.json`.

## Teste antes de divulgar
Faça um pedido de teste e confira se a linha aparece na aba `Pedidos`. Teste também o cenário de 4 bottons do mesmo modelo (R$ 21,00) e o cenário de 2 camisas + 3 bottons de um modelo + 5 de outro (R$ 128,00). Use dados de teste, não CPF real de terceiros.

## Observações
- A integração Pix ainda não está ligada; por enquanto o pedido entra como `Aguardando pagamento`.
- Como há CPF e telefone, restrinja o compartilhamento da planilha apenas às pessoas responsáveis pelos pedidos e siga as práticas aplicáveis de proteção de dados.
- As imagens dos produtos estão apontando para os endereços que já eram usados no formulário anterior. Recomendável migrá-las para um armazenamento próprio do projeto antes de divulgação ampla.
