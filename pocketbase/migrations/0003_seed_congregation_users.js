migrate(
  (app) => {
    const users = [
      { name: 'Secretário', email: 'secretario@congregacao.com' },
      { name: 'Devaldo', email: 'devaldo@congregacao.com' },
      { name: 'Ricardo', email: 'ricardo@congregacao.com' },
      { name: 'Jailton', email: 'jailton@congregacao.com' },
      { name: 'Gleidson', email: 'gleidson@congregacao.com' },
    ]

    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    for (const u of users) {
      try {
        // Idempotent check
        app.findAuthRecordByEmail('_pb_users_auth_', u.email)
      } catch (_) {
        const record = new Record(collection)
        record.setEmail(u.email)
        record.setPassword('123456')
        record.setVerified(true)
        record.set('name', u.name)
        app.save(record)
      }
    }
  },
  (app) => {
    const emails = [
      'secretario@congregacao.com',
      'devaldo@congregacao.com',
      'ricardo@congregacao.com',
      'jailton@congregacao.com',
      'gleidson@congregacao.com',
    ]

    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(record)
      } catch (_) {}
    }
  },
)
