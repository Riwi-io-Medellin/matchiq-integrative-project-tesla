import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = 'matchiqtesla3@gmail.com';

export async function sendPasswordResetEmail({ to, resetUrl }) {
  await sgMail.send({
    from: { name: 'MatchIQ', email: FROM_EMAIL },
    to,
    subject: 'Recuperar contraseña — MatchIQ',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #6B3FA0;">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en MatchIQ.</p>
        <p>Haz click en el botón para continuar. El enlace expira en <strong>30 minutos</strong>.</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          margin-top: 24px;
          padding: 12px 24px;
          background: #6B3FA0;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        ">Restablecer contraseña</a>
        <p style="margin-top: 24px; color: #9E9E9E; font-size: 13px;">
          Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationCodeEmail({ to, code }) {
  await sgMail.send({
    from: { name: 'MatchIQ', email: FROM_EMAIL },
    to,
    subject: 'Verifica tu cuenta — MatchIQ',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #6B3FA0;">Verifica tu cuenta</h2>
        <p>Gracias por registrarte en MatchIQ. Usa el siguiente código para verificar tu email:</p>
        <div style="
          margin: 32px auto;
          text-align: center;
          letter-spacing: 12px;
          font-size: 40px;
          font-weight: bold;
          color: #6B3FA0;
          background: #F3EEFF;
          border-radius: 12px;
          padding: 24px;
          width: fit-content;
        ">${code}</div>
        <p>Este código expira en <strong>10 minutos</strong>.</p>
        <p style="margin-top: 24px; color: #9E9E9E; font-size: 13px;">
          Si no creaste una cuenta en MatchIQ, ignora este correo.
        </p>
      </div>
    `,
  });
}