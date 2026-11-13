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

## Atualização visual — Fase 1
- Mantida a identidade visual azul, bege e branco da Lojinha Geração.
- Incluída tabela de medidas oficial para P, M, G e GG (medidas em centímetros).
- Tamanhos disponíveis nos dois modelos: P, M, G e GG (G1, G2 e G3 foram removidos).
- Adicionados controles de quantidade (+ e −), mantendo a digitação manual.
- Refinados cartões, botões, etapas, áreas de produto, resumo e pagamento, com ajustes responsivos.
- Não foi implementado carrinho persistente. O CPF e as regras comerciais foram mantidos.

## Tamanhos de camisa aceitos
P, M, G e GG. O preço unitário permanece R$ 45,00.

## Controle de Estoque (Camisas e Bottons)
O site possui controle de estoque em tempo real com proteção contra compras simultâneas da mesma peça (reserva atômica via Lua script no Upstash Redis).

### Quantidades configuradas

#### Camisas
- **A onda que vira fogo:**
  - **P:** 4 unidades
  - **M:** 4 unidades
  - **G:** 0 (esgotado — já adquiridas antecipadamente)
  - **GG:** 1 unidade
  *(Total: 9 disponíveis)*

- **O ciclo recomeça:**
  - **P:** 4 unidades
  - **M:** 2 unidades (4 no lote inicial, sendo 2 já vendidas fora da lojinha)
  - **G:** 0 (esgotado — já adquiridas antecipadamente)
  - **GG:** 1 unidade
  *(Total: 7 disponíveis)*

#### Bottons
- **Geração em Chamas:** 30 iniciais − 3 vendidos na planilha = **27 disponíveis**
- **Álbum da Cidade:** 30 iniciais − 3 vendidos na planilha = **27 disponíveis**
- **O Maior Núcleo da Bahia:** 12 iniciais − 0 vendidos = **12 disponíveis**
- **Grandões e Sem Medo:** 16 iniciais − 1 vendido na planilha = **15 disponíveis**
- **Sol, Onda e Montanha:** 12 iniciais − 0 vendidos = **12 disponíveis**
*(Total: 100 iniciais − 7 vendidos = **93 disponíveis**)*

Para alterar quantidades iniciais ou vendas prévias, edite `SHIRT_SIZE_LIMITS`, `BUTTON_LIMITS` e `INITIAL_SOLD` em `api/_estoque.js`.

### Como o estoque é persistido entre os clientes (Vercel)
Para que a compra de um cliente dê baixa imediatamente no estoque e a próxima pessoa já veja a quantidade reduzida, é necessário conectar o **Upstash Redis** na Vercel:
1. No painel do projeto na Vercel, acesse **Storage** (ou **Marketplace**).
2. Adicione **Upstash Redis** (plano Free gratuito).
3. Conecte ao projeto `lojinha-geracao`.
4. As variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` são injetadas automaticamente pela Vercel.
5. Faça um novo Deploy (Redeploy) no painel.

*Nota: Se o Upstash Redis não for conectado, o sistema opera em modo de desenvolvimento com memória local da função serverless.*

### Gestão Administrativa do Estoque
- **Consultar estoque:** `GET /api/estoque` retorna o total disponível e o status `persistent: true/false`.
- **Ajustar ou resetar estoque (opcional):**
  Defina a variável `ADMIN_TOKEN` nas configurações de ambiente da Vercel.
  - Resetar contagem: `POST /api/estoque` com header `Authorization: Bearer <SEU_TOKEN>` e corpo `{"action": "reset"}`.
  - Ajustar peças vendidas de um tamanho: `POST /api/estoque` com header `Authorization: Bearer <SEU_TOKEN>` e corpo `{"action": "set", "size": "camisa_onda_m", "sold": 1}`.

