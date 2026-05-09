migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'willembergdasilva3@jwpub.org')
      user.setPassword('123@Senha')
      user.setVerified(true)
      user.set('role', 'Responsável')
      user.set('group_number', 1)
      user.set('group_name', 'Grupo 1')
      app.save(user)
    } catch (_) {
      // Ignore if not found
    }

    const users = app.findRecordsByFilter('_pb_users_auth_', "id != ''", '', 1000, 0)
    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      if (u.getBool('emailVisibility') !== true) {
        u.set('emailVisibility', true)
        app.save(u)
      }
    }
  },
  (app) => {},
)
