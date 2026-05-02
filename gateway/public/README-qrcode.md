# Como adicionar seu QR Code PIX

1. Gere o QR Code estático no app do seu banco (Nubank, Inter, etc.)
   - Nubank: Cobrar → QR Code estático → Salvar imagem
   - Inter: PIX → Receber → QR Code → Salvar

2. Salve a imagem com o nome exato: `pix-qrcode.png`
   (ou .jpg - ajuste o server.ts se necessário)

3. Coloque o arquivo nesta pasta: `gateway/public/pix-qrcode.png`

4. Faça o deploy — a imagem será servida em /pix-qrcode.png
