migrate(
  (app) => {
    const updates = [
      { name: 'Devaldo', role: 'Secretário', group_number: 1 },
      { name: 'Willemberg', role: 'Responsável', group_number: 1 },
      { name: 'Ricardo', role: 'Responsável', group_number: 2 },
      { name: 'Emanuel', role: 'Responsável', group_number: 3 },
      { name: 'Jailton', role: 'Responsável', group_number: 3 },
      { name: 'Gleidson', role: 'Responsável', group_number: 4 },
      { name: 'Gilmar', role: 'Responsável', group_number: 4 },
    ]

    for (const u of updates) {
      app
        .db()
        .newQuery(
          'UPDATE users SET role = {:role}, group_number = {:group_number} WHERE name LIKE {:name}',
        )
        .bind({ role: u.role, group_number: u.group_number, name: `%${u.name}%` })
        .execute()
    }
  },
  (app) => {
    // Irreversible without prior state
  },
)
