migrate(
  (app) => {
    const usersToUpdate = [
      { name: 'Ricardo Valença', searchName: 'Ricardo', email: 'rvalenca@jwpub.org' },
      { name: 'Emanuel Carvalho', searchName: 'Emanuel', email: 'emanuelcarvalho45@jwpub.org' },
      { name: 'Jailton Conceição', searchName: 'Jailton', email: 'jailtonc9@jwpub.org' },
      { name: 'Gilmar Batista', searchName: 'Gilmar', email: 'gilmard3@jwpub.org' },
      { name: 'Willemberg Weber', searchName: 'Willemberg', email: 'willembergdasilva3@jwpub.org' },
      { name: 'Gleidson Gomes', searchName: 'Gleidson', email: 'ggleidson@jwpub.org' },
    ]

    for (const u of usersToUpdate) {
      let record = null

      // 1. Try finding by the target email
      try {
        record = app.findAuthRecordByEmail('users', u.email)
      } catch (_) {}

      // 2. If not found by email, try finding by name
      if (!record) {
        try {
          const records = app.findRecordsByFilter('users', 'name ~ {:name}', '-created', 1, 0, {
            name: u.searchName,
          })
          if (records.length > 0) {
            record = records[0]
          }
        } catch (_) {}
      }

      if (record) {
        record.setEmail(u.email)
        record.setPassword('123@Senha')
        record.set('name', u.name)
        record.setVerified(true)
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert is not feasible as we do not store the original emails and passwords.
  },
)
