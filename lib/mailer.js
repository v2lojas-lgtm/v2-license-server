const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendLicenseEmail({ to, licenseKey, maxActivations, expiresAt }) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('pt-BR')
  const pcs = maxActivations === 1 ? '1 PC' : `${maxActivations} PCs`

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject: 'Sua licença do V2 Game Optimizer',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#111">V2 Game Optimizer</h2>
        <p>Obrigado pela compra! Sua licença está pronta para ativação.</p>

        <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0;text-align:center">
          <p style="margin:0 0 8px;color:#666;font-size:13px">SUA LICENSE KEY</p>
          <p style="font-size:22px;font-weight:bold;letter-spacing:2px;color:#111;margin:0">${licenseKey}</p>
        </div>

        <ul style="color:#444;line-height:1.8">
          <li>Válida para: <strong>${pcs}</strong></li>
          <li>Expira em: <strong>${expiryDate}</strong></li>
        </ul>

        <p style="color:#444">
          <a href="https://github.com/v2lojas-lgtm/v2-game-optimizer/releases/download/v0.1.0/V2-Game-Optimizer-Setup-0.1.0.exe"
             style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-bottom:16px">
            ⬇ Baixar V2 Game Optimizer
          </a>
        </p>
        <p style="color:#444">Após instalar, abra o app, clique em <strong>Ativar licença</strong> e insira a chave acima.</p>

        <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
        <p style="color:#999;font-size:12px">Dúvidas? Responda este email.</p>
      </div>
    `
  })
}

module.exports = { sendLicenseEmail }
