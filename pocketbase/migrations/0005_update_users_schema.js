migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['Secretário', 'Responsável'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('group_name')) {
      users.fields.add(
        new SelectField({
          name: 'group_name',
          values: ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4'],
          maxSelect: 1,
        }),
      )
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }

    if (users.fields.getByName('group_name')) {
      users.fields.removeByName('group_name')
    }

    app.save(users)
  },
)
