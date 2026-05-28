migrate(
  (app) => {
    const collection = new Collection({
      name: 'deliberative_reports',
      type: 'base',
      listRule: "@request.auth.role = 'Secretário'",
      viewRule: "@request.auth.role = 'Secretário'",
      createRule: "@request.auth.role = 'Secretário'",
      updateRule: "@request.auth.role = 'Secretário'",
      deleteRule: "@request.auth.role = 'Secretário'",
      fields: [
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'json', required: false },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('deliberative_reports')
    app.delete(collection)
  },
)
