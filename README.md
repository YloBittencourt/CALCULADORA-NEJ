# Lojinha Geração — envio de comprovante Pix

Projeto da loja hospedado na Vercel, integrado ao Google Apps Script e Google Planilhas.

## O que foi acrescentado nesta versão
- Campo para anexar comprovante Pix na tela de pagamento.
- Aceita JPG, PNG e PDF, com limite de 3 MB.
- Envia o arquivo para a função `/api/comprovantes` na Vercel.
- O Apps Script salva o comprovante na pasta do Google Drive `Comprovantes Lojinha Geração` (criada automaticamente).
- Na aba `Pedidos`, grava o link do arquivo na coluna `Comprovante` e a data na coluna `Data do comprovante`.
- Ao receber comprovante, altera `Pagamento` para `Aguardando confirmação` e `Status do pedido` para `Comprovante enviado`.
- O sistema NÃO marca como `Pago` automaticamente. A equipe deve conferir o crédito na conta e mudar manualmente para `Pago`.

## IMPORTANTE: atualizar o Apps Script antes de publicar este ZIP
O envio de comprovantes exige permissão do Apps Script para criar arquivos no Google Drive. O código atualizado está em `apps-script/Code.gs`.

1. Abra a planilha Google e acesse **Extensões → Apps Script**.
2. Abra `Código.gs`, substitua todo o conteúdo pelo arquivo `apps-script/Code.gs` deste ZIP.
3. Salve.
4. Clique em **Implantar → Gerenciar implantações**.
5. Edite a implantação existente (ícone de lápis), escolha **Nova versão** e clique em **Implantar**.
6. Autorize as permissões solicitadas para acessar a planilha e criar arquivos no Google Drive. A pasta `Comprovantes Lojinha Geração` será criada automaticamente no primeiro envio.
7. Mantenha a implantação como **Executar como: Eu** e **Quem pode acessar: Qualquer pessoa**.

O ID da planilha já está configurado no código. A aba deve continuar se chamando `Pedidos` e manter as 13 colunas originais na mesma ordem. O Apps Script adiciona automaticamente as colunas N e O: `Comprovante` e `Data do comprovante`.

## Publicar na Vercel
Depois de atualizar e implantar o Apps Script:
1. Atualize o projeto da Vercel com os arquivos deste ZIP, mantendo a estrutura de pastas.
2. Confirme que `index.html` está na raiz e as funções estão em `api/pedidos.js` e `api/comprovantes.js`.
3. Faça um novo deploy.

## Fluxo de pedido e pagamento
1. O pedido é registrado na planilha.
2. Só depois da confirmação do registro, o site exibe o Pix.
3. O cliente envia o comprovante na mesma tela.
4. O comprovante é guardado no Drive e o link aparece na planilha.
5. O status passa para `Aguardando confirmação` / `Comprovante enviado`.
6. Após conferir o crédito na conta, a equipe muda `Pagamento` para `Pago` manualmente.

## QR Code Pix
A imagem deve se chamar exatamente `pix-qr-code.png` e ficar na raiz do projeto, ao lado de `index.html`.

## Limites e segurança
- Tipos permitidos: JPG, PNG e PDF.
- Tamanho máximo: 3 MB.
- Os arquivos ficam na pasta do Drive da conta que executa o Apps Script. O link salvo na planilha é para uso da equipe com acesso ao Drive; não é publicado como arquivo aberto ao público.
- O envio de comprovante não comprova, por si só, que o Pix foi recebido. Confirme sempre no extrato bancário antes de marcar como `Pago`.
