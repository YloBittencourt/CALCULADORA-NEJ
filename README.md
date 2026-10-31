# Lojinha Geração — site de pedidos

Projeto sem Tally para hospedagem na Vercel. O site usa HTML/CSS/JS e uma função serverless para validar pedidos e registrar os dados no Google Planilhas.

## O que está implementado
- Dados do cliente primeiro (nome, CPF e WhatsApp).
- Dois modelos de camisa a R$ 45,00, com seleção por tamanho.
- Cinco modelos de bottons.
- Preço dos bottons por modelo: unidade R$ 6, combo de 3 R$ 15, combo de 5 R$ 23; excedentes calculados a R$ 6 por unidade.
- Revisão do pedido antes de confirmar.
- Validação de CPF e recálculo dos valores no servidor.
- Registro em uma nova linha da aba `Pedidos`.
- Após o registro, exibe o número do pedido, o valor total, a chave Pix `vpggdonejelementar@gmail.com` e um espaço para o QR Code.
- O pagamento permanece com confirmação manual; não há conciliação automática com o banco.

## Configurar a planilha Google
A planilha deve ter uma aba chamada `Pedidos` e a primeira linha com estas colunas, nesta ordem:

`Pedido | Data/hora | Nome | CPF | Telefone | Camisas (detalhe) | Qtde camisas | Bottons (detalhe) | Subtotal camisas | Subtotal bottons | Total | Pagamento | Status do pedido`

O ID da planilha é o trecho entre `/d/` e `/edit` na URL. Compartilhe a planilha com o e-mail da conta de serviço do Google, dando permissão de Editor.

## Integração com Google Apps Script
A função `api/pedidos.js` envia os dados do pedido ao Apps Script publicado como aplicativo da Web. Não é necessário configurar conta de serviço, chave privada, Google Cloud ou variáveis de ambiente na Vercel. O endereço publicado do Apps Script já está configurado no arquivo da API.

O site só libera a tela Pix quando o Apps Script responde com `sucesso: true`, depois de inserir a linha na aba `Pedidos`.

## Adicionar a imagem do QR Code Pix
A tela de pagamento já reserva o espaço para a imagem. Para inserir o QR Code:
1. Tire/recorte o print da imagem do QR Code Pix.
2. Salve a imagem em PNG com o nome exato `pix-qr-code.png`.
3. Coloque o arquivo na pasta principal do projeto, ao lado de `index.html`.
4. Envie o projeto atualizado para a Vercel e faça redeploy.

Se o arquivo ainda não estiver presente, o site mostra automaticamente o espaço reservado com instruções. A chave Pix exibida é `vpggdonejelementar@gmail.com` e possui botão para copiar.

## Publicar na Vercel
Mantenha `index.html` na raiz e `api/pedidos.js` dentro da pasta `api`. Atualize o projeto existente na Vercel com estes arquivos e faça redeploy. A dependência `googleapis` será instalada a partir do `package.json`.

## Testes recomendados
- 4 bottons do mesmo modelo: R$ 21,00.
- 2 camisas + 3 bottons de um modelo + 5 de outro: R$ 128,00.
- Envie um pedido de teste e confirme se aparece na aba `Pedidos` e se a tela Pix mostra o mesmo total.
- Use dados de teste, não CPF real de terceiros.

## Privacidade
Como a planilha contém CPF e telefone, restrinja o compartilhamento às pessoas responsáveis pelos pedidos. O pagamento é marcado como `Aguardando pagamento` e o status do pedido como `Recebido`; a confirmação do Pix deve ser feita manualmente.
