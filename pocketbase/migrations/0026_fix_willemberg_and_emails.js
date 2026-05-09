migrate(
  (app) => {
    const users = app.findRecordsByFilter('users', '1=1', '', 1000, 0)

    for (const user of users) {
      user.set('emailVisibility', true)

      const name = user.getString('name').toLowerCase()
      if (name.includes('wilemberg') || name.includes('willemberg')) {
        user.setPassword('123@Senha')
      }

      try {
        app.save(user)
      } catch (e) {
        try {
          app.saveNoValidate(user)
        } catch (err) {
          console.log('Failed to save user', user.getString('id'))
        }
      }
    }
  },
  (app) => {
    // No rollback needed for data fixes
  },
)
