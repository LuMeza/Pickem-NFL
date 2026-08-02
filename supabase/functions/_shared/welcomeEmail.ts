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
    <title>Bienvenido a Pickem NFL</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0B0F14; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F14; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#141B23; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px; text-align:center;">
                <span style="font-size:13px; letter-spacing:1px; color:#8A97A6; text-transform:uppercase;">🏈 Pickem NFL</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px; text-align:center;">
                <h1 style="margin:0; font-size:26px; line-height:1.3; color:#F4F6F8; font-family:Arial, Helvetica, sans-serif;">
                  ¡Bienvenido, ${params.displayName}!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; text-align:center;">
                <p style="margin:0; font-size:15px; line-height:1.6; color:#8A97A6;">
                  Ya te dieron de alta en el Pickem NFL. Inicia sesión con estos datos —
                  te va a pedir elegir una contraseña nueva la primera vez.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F14; border-radius:10px;">
                  <tr>
                    <td style="padding:16px 20px;">
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
              <td style="padding:28px 32px; text-align:center;">
                <a
                  href="${params.loginUrl}"
                  style="display:inline-block; background-color:#C8FF3D; color:#0B0F14; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:10px;"
                >
                  Iniciar sesión
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px; text-align:center;">
                <p style="margin:0; font-size:13px; line-height:1.6; color:#8A97A6;">
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
