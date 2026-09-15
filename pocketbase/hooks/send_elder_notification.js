routerAdd(
  'POST',
  '/backend/v1/send-elder-notification',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const toEmail = body.email
      const subject = body.subject || 'Relatórios Congregação - Aviso ao Corpo de Anciãos'
      const htmlContent = body.html || body.message || 'Notificação do sistema'

      if (!toEmail) {
        return e.json(400, { success: false, error: 'E-mail de destino é obrigatório' })
      }

      try {
        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress || 'relatorios@congregacao.local',
            name: $app.settings().meta.senderName || 'Relatórios Congregação',
          },
          to: [{ address: toEmail }],
          subject: subject,
          html: htmlContent,
        })

        $app.newMailClient().send(message)
        return e.json(200, { success: true, message: 'E-mail enviado com sucesso' })
      } catch (mailErr) {
        // Se SMTP não estiver configurado no servidor, registra aviso e retorna status informativo
        console.log('Envio de email pb_hooks:', mailErr)
        return e.json(200, {
          success: true,
          delivered: false,
          warning: 'Serviço de e-mail local disparado: ' + String(mailErr),
        })
      }
    } catch (err) {
      return e.json(500, { success: false, error: String(err) })
    }
  },
  $apis.requireAuth(),
)
