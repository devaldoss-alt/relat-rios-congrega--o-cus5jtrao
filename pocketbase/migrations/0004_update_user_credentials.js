migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const targetUsers = [
      { email: 'devaldo@congregacao.com', name: 'Devaldo' },
      { email: 'ricardo@congregacao.com', name: 'Ricardo Valença' },
      { email: 'emanuel@congregacao.com', name: 'Emanuel' },
      { email: 'jailton@congregacao.com', name: 'Jailton' },
      { email: 'gleidson@congregacao.com', name: 'Gleidson' },
    ]

    for (const u of targetUsers) {
      try {
        // Check if user already exists
        const existing = app.findAuthRecordByEmail('_pb_users_auth_', u.email)

        // Update existing to match the requested state
        existing.set('name', u.name)
        existing.setPassword('Skip@Pass')
        app.save(existing)
      } catch (_) {
        // User does not exist, create a new one to avoid duplicate errors
        const record = new Record(usersCol)
        record.setEmail(u.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', u.name)
        app.save(record)
      }
    }
  },
  (app) => {
    const targetEmails = [
      'devaldo@congregacao.com',
      'ricardo@congregacao.com',
      'emanuel@congregacao.com',
      'jailton@congregacao.com',
      'gleidson@congregacao.com',
    ]

    for (const email of targetEmails) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(record)
      } catch (_) {}
    }
  },
)
