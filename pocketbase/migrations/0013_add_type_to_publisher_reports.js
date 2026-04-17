migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('publisher_reports')

    if (!col.fields.getByName('type')) {
      col.fields.add(
        new SelectField({
          name: 'type',
          values: ['publicador', 'pioneiro_auxiliar', 'pioneiro_regular'],
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('publisher_reports')

    if (col.fields.getByName('type')) {
      col.fields.removeByName('type')
      app.save(col)
    }
  },
)
