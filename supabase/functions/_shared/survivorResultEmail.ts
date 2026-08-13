// Plantilla del correo de resultado semanal de Survivor (sigue vivo /
// eliminado), mismo estilo visual que welcomeEmail.ts.
export interface SurvivorResultEmailParams {
  displayName: string
  weekNumber: number
  teamName: string
  type: 'alive' | 'eliminated'
  reason: 'won' | 'life_used' | 'lost_no_lives' | 'life_rejected'
  pickUrl: string
}

const COPY: Record<SurvivorResultEmailParams['reason'], { headline: string; body: string; accent: string }> = {
  won: {
    headline: '¡Sigues vivo en Survivor!',
    body: 'ganó su partido esta semana. Ya puedes elegir tu equipo para la próxima semana.',
    accent: '#C8FF3D',
  },
  life_used: {
    headline: 'Usaste una vida, pero sigues vivo',
    body: 'perdió esta semana, pero tu vida extra aprobada te mantiene en el Survivor. Ya puedes elegir tu equipo para la próxima semana.',
    accent: '#C8FF3D',
  },
  lost_no_lives: {
    headline: 'Quedaste eliminado del Survivor',
    body: 'perdió esta semana y ya no te quedaban vidas disponibles. Puedes seguir viendo la tabla del grupo.',
    accent: '#FF6B6B',
  },
  life_rejected: {
    headline: 'Quedaste eliminado del Survivor',
    body: 'perdió esta semana y tu solicitud de vida extra fue rechazada. Puedes seguir viendo la tabla del grupo.',
    accent: '#FF6B6B',
  },
}

export function buildSurvivorResultEmailHtml(params: SurvivorResultEmailParams): string {
  const copy = COPY[params.reason]
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Resultado Survivor — Semana ${params.weekNumber}</title>
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
              <td style="line-height:4px; font-size:4px; background:linear-gradient(90deg, ${copy.accent}, #F2B705); background-color:${copy.accent};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <span style="display:inline-block; font-family:'Courier New', monospace; font-size:11px; letter-spacing:1.5px; color:${copy.accent}; text-transform:uppercase; background-color:rgba(200,255,61,0.10); border:1px solid rgba(200,255,61,0.25); border-radius:999px; padding:6px 14px;">🏈 Survivor — Semana ${params.weekNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <h1 style="margin:0; font-size:26px; line-height:1.25; color:${copy.accent}; letter-spacing:0.02em; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif;">
                  ${copy.headline}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <p style="margin:0; font-size:15px; line-height:1.6; color:#8A97A6;">
                  Hola ${params.displayName}, tu equipo <strong style="color:#F4F6F8;">${params.teamName}</strong> ${copy.body}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px 32px; text-align:center; background-color:#141B23;" bgcolor="#141B23">
                <a
                  href="${params.pickUrl}"
                  style="display:inline-block; background-color:${copy.accent}; color:#0B0F14; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:10px;"
                >
                  Ver Survivor
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
