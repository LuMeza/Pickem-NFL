// Envío de correo transaccional vía SMTP (Gmail) desde Edge Functions.
// Usa denomailer (cliente SMTP nativo de Deno) en vez de nodemailer porque
// nodemailer depende del módulo `net` de Node, no soportado en el Edge Runtime.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/** Puede fallar (SMTP caído, credenciales mal puestas, etc.) sin frenar el flujo que la llama. */
export async function sendEmail(params: SendEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const username = Deno.env.get('GMAIL_USER')
  const password = Deno.env.get('GMAIL_APP_PASSWORD')

  if (!username || !password) {
    return { ok: false, error: 'Faltan las secrets GMAIL_USER / GMAIL_APP_PASSWORD' }
  }

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username, password },
    },
  })

  try {
    await client.send({
      from: `Pickem NFL <${username}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  } finally {
    await client.close()
  }
}
