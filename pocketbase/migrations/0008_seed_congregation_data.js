migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, role, groupNumber) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        record.set('group_number', groupNumber)
        app.save(record)
        return record
      }
    }

    const devaldo = seedUser('devaldo@congregacao.com', 'Devaldo', 'Secretário', 1)
    const wilemberg = seedUser('wilemberg@congregacao.com', 'Wilemberg', 'Responsável', 1)
    const ricardo = seedUser('ricardo@congregacao.com', 'Ricardo', 'Responsável', 2)
    const emanuel = seedUser('emanuel@congregacao.com', 'Emanuel', 'Responsável', 3)
    const jailton = seedUser('jailton@congregacao.com', 'Jailton', 'Responsável', 3)
    const gleidson = seedUser('gleidson@congregacao.com', 'Gleidson', 'Responsável', 4)
    const gilmar = seedUser('gilmar@congregacao.com', 'Gilmar', 'Responsável', 4)

    const groups = app.findCollectionByNameOrId('groups')

    const seedGroup = (number, leaderId) => {
      try {
        return app.findFirstRecordByData('groups', 'number', number)
      } catch (_) {
        const record = new Record(groups)
        record.set('number', number)
        if (leaderId) {
          record.set('leader', leaderId)
        }
        app.save(record)
        return record
      }
    }

    seedGroup(1, wilemberg.id)
    seedGroup(2, ricardo.id)
    seedGroup(3, emanuel.id)
    seedGroup(4, gleidson.id)
  },
  (app) => {
    const emails = [
      'devaldo@congregacao.com',
      'wilemberg@congregacao.com',
      'ricardo@congregacao.com',
      'emanuel@congregacao.com',
      'jailton@congregacao.com',
      'gleidson@congregacao.com',
      'gilmar@congregacao.com',
    ]

    emails.forEach((email) => {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(record)
      } catch (_) {}
    })

    try {
      const groups = app.findRecordsByFilter('groups', '1=1', '', 100, 0)
      groups.forEach((g) => app.delete(g))
    } catch (_) {}
  },
)
