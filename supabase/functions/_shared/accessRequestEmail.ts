export interface AccessRequestEmailParams {
  requesterName: string
  moduleLabel: string
  reviewUrl: string
}

export function buildAccessRequestEmailHtml(params: AccessRequestEmailParams): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Nueva solicitud de acceso</title>
    <style>
      :root { color-scheme: dark; supported-color-schemes: dark; }
      body, .email-bg { background-color: #0B0F14 !important; }
      .email-card { background-color: #141B23 !important; }
      @media (prefers-color-scheme: light) {
        body, .email-bg { background-color: #0B0F14 !important; }
        .email-card { background-color: #141B23 !important; }
      }
      @media (prefers-color-scheme: dark) {
        body, .email-bg { background-color: #0B0F14 !important; }
        .email-card { background-color: #141B23 !important; }
      }
      [data-ogsc] .email-bg, [data-ogsb] .email-bg { background-color: #0B0F14 !important; }
      [data-ogsc] .email-card, [data-ogsb] .email-card { background-color: #141B23 !important; }
    </style>
  </head>
  <body class="email-bg" style="margin:0; padding:0; background:#0B0F14; background-color:#0B0F14;" bgcolor="#0B0F14">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#0B0F14; background-color:#0B0F14; padding:32px 16px; font-family:Arial, Helvetica, sans-serif;" bgcolor="#0B0F14">
      <tr>
        <td align="center" class="email-bg" style="background:#0B0F14; background-color:#0B0F14;" bgcolor="#0B0F14">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" class="email-card" style="max-width:480px; width:100%; background:#141B23; background-color:#141B23; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden;" bgcolor="#141B23">
            <tr>
              <td style="line-height:4px; font-size:4px; background:linear-gradient(90deg, #C8FF3D, #F2B705); background-color:#C8FF3D;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <span style="display:inline-block; font-family:'Courier New', monospace; font-size:11px; letter-spacing:1.5px; color:#C8FF3D; text-transform:uppercase; background-color:rgba(200,255,61,0.10); border:1px solid rgba(200,255,61,0.25); border-radius:999px; padding:6px 14px;">🏈 Pickem NFL</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <h1 style="margin:0; font-size:26px; line-height:1.25; color:#F4F6F8; letter-spacing:0.02em; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif;">
                  Nueva solicitud de acceso
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <p style="margin:0; font-size:15px; line-height:1.6; color:#8A97A6;">
                  <strong style="color:#F4F6F8;">${params.requesterName}</strong> pidió acceso a
                  <strong style="color:#F4F6F8;">${params.moduleLabel}</strong>. Entra a la plataforma para aprobarla o rechazarla.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <a
                  href="${params.reviewUrl}"
                  style="display:inline-block; background-color:#C8FF3D; color:#0B0F14; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:10px;"
                >
                  Ver solicitud
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}
