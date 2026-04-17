migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Update existing secretario@congregacao.com to gilmar@congregacao.com
    try {
      const gilmar = app.findAuthRecordByEmail('_pb_users_auth_', 'secretario@congregacao.com')
      gilmar.setEmail('gilmar@congregacao.com')
      gilmar.set('name', 'Gilmar Batista')
      gilmar.set('role', 'Responsável')
      gilmar.set('group_name', 'Grupo 4')
      app.save(gilmar)
    } catch (_) {
      // Record might have already been updated or doesn't exist.
    }

    // Data Integrity mappings
    const userData = [
      { email: 'devaldo@congregacao.com', name: 'Devaldo', role: 'Secretário', group: 'Grupo 1' },
      {
        email: 'ricardo@congregacao.com',
        name: 'Ricardo Valença',
        role: 'Responsável',
        group: 'Grupo 2',
      },
      { email: 'emanuel@congregacao.com', name: 'Emanuel', role: 'Responsável', group: 'Grupo 3' },
      { email: 'jailton@congregacao.com', name: 'Jailton', role: 'Responsável', group: 'Grupo 3' },
      {
        email: 'gleidson@congregacao.com',
        name: 'Gleidson',
        role: 'Responsável',
        group: 'Grupo 4',
      },
      {
        email: 'gilmar@congregacao.com',
        name: 'Gilmar Batista',
        role: 'Responsável',
        group: 'Grupo 4',
      },
      {
        email: 'wilemberg@congregacao.com',
        name: 'Wilemberg Weber',
        role: 'Responsável',
        group: 'Grupo 1',
      },
    ]

    for (const data of userData) {
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', data.email)
        user.set('name', data.name)
        user.set('role', data.role)
        user.set('group_name', data.group)
        app.save(user)
      } catch (_) {
        // User doesn't exist, create it
        const record = new Record(users)
        record.setEmail(data.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', data.name)
        record.set('role', data.role)
        record.set('group_name', data.group)
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert Wilemberg
    try {
      const wilemberg = app.findAuthRecordByEmail('_pb_users_auth_', 'wilemberg@congregacao.com')
      app.delete(wilemberg)
    } catch (_) {}

    // Revert Gilmar
    try {
      const gilmar = app.findAuthRecordByEmail('_pb_users_auth_', 'gilmar@congregacao.com')
      gilmar.setEmail('secretario@congregacao.com')
      gilmar.set('name', 'Secretário')
      gilmar.set('role', '')
      gilmar.set('group_name', '')
      app.save(gilmar)
    } catch (_) {}
  },
)
