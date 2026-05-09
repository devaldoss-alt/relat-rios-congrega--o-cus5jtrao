migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'willembergdasilva3@jwpub.org')
      record.set('group_number', 1)
      record.set('group_name', 'Grupo 1')
      app.save(record)
    } catch (_) {
      // Ignore if user not found
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'willembergdasilva3@jwpub.org')
      record.set('group_number', 0)
      record.set('group_name', '')
      app.save(record)
    } catch (_) {
      // Ignore if user not found
    }
  },
)
