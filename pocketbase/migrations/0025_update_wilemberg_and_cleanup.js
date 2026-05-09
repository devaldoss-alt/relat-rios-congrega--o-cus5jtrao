migrate(
  (app) => {
    // 1. Update Wilemberg Weber to Grupo 1
    try {
      const records = app.findRecordsByFilter(
        'users',
        "name ~ 'Wilemberg' || name ~ 'Willemberg' || name ~ 'Weber'",
        '',
        100,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        record.set('group_number', 1)
        record.set('group_name', 'Grupo 1')
        app.save(record)
      }
    } catch (err) {
      console.log('Error updating Wilemberg Weber:', err)
    }

    // 2. Delete Administrador user with group 0
    try {
      const admins = app.findRecordsByFilter(
        'users',
        "name = 'Administrador' && group_number = 0",
        '',
        100,
        0,
      )
      for (let i = 0; i < admins.length; i++) {
        const admin = admins[i]
        app.delete(admin)
      }
    } catch (err) {
      console.log('Error deleting Administrador:', err)
    }
  },
  (app) => {
    // down migration - revert Wilemberg Weber back to Group 0
    try {
      const records = app.findRecordsByFilter(
        'users',
        "name ~ 'Wilemberg' || name ~ 'Willemberg' || name ~ 'Weber'",
        '',
        100,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        record.set('group_number', 0)
        record.set('group_name', 'Grupo 0')
        app.save(record)
      }
    } catch (err) {
      // Ignore error
    }
  },
)
