migrate(
  (app) => {
    // Update Willemberg specifically
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'willembergdasilva3@jwpub.org')
      user.setPassword('123@Senha')
      user.setVerified(true)
      user.set('emailVisibility', true)
      if (!user.getString('role')) {
        user.set('role', 'Responsável')
      }
      app.saveNoValidate(user)
    } catch (_) {
      // User not found, skip or continue
    }

    // Standardize entire user base
    const users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 1000, 0)
    for (const user of users) {
      let changed = false
      if (!user.getBool('verified')) {
        user.setVerified(true)
        changed = true
      }
      if (!user.getString('role')) {
        user.set('role', 'Responsável') // Safe default role
        changed = true
      }

      if (changed) {
        app.saveNoValidate(user)
      }
    }
  },
  (app) => {
    // No specific down migration needed for data standardizations
  },
)
