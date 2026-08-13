export interface WelcomeEmailParams {
  displayName: string
  email: string
  provisionalPassword: string
  loginUrl: string
}

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Bienvenido a Pickem NFL</title>
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
                <h1 style="margin:0; font-size:28px; line-height:1.25; color:#F4F6F8; letter-spacing:0.02em; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif;">
                  ¡Bienvenido, ${params.displayName}!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <p style="margin:0; font-size:15px; line-height:1.6; color:#8A97A6;">
                  Ya te dieron de alta en el Pickem NFL. Inicia sesión con estos datos —
                  te va a pedir elegir una contraseña nueva la primera vez.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px; background-color:#141B23;" bgcolor="#141B23">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#0B0F14; background-color:#0B0F14; border-radius:10px;" bgcolor="#0B0F14">
                  <tr>
                    <td style="padding:16px 20px; background-color:#0B0F14;" bgcolor="#0B0F14">
                      <p style="margin:0 0 4px 0; font-size:12px; letter-spacing:0.5px; color:#8A97A6; text-transform:uppercase;">Correo</p>
                      <p style="margin:0 0 12px 0; font-size:15px; color:#F4F6F8; font-family:'Courier New', monospace;">${params.email}</p>
                      <p style="margin:0 0 4px 0; font-size:12px; letter-spacing:0.5px; color:#8A97A6; text-transform:uppercase;">Contraseña provisional</p>
                      <p style="margin:0; font-size:15px; color:#C8FF3D; font-family:'Courier New', monospace;">${params.provisionalPassword}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <a
                  href="${params.loginUrl}"
                  style="display:inline-block; background-color:#C8FF3D; color:#0B0F14; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:10px;"
                >
                  Iniciar sesión
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px; text-align:center; border-top:1px dashed rgba(255,255,255,0.08); background-color:#141B23;" bgcolor="#141B23">
                <p style="margin:16px 0 0 0; font-size:13px; line-height:1.6; color:#8A97A6;">
                  Si no esperabas este correo, ignoralo — no se creó ninguna sesión activa con estos datos.
                </p>
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
