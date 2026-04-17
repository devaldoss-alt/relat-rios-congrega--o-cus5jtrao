migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('publisher_reports')
    col.fields.add(new BoolField({ name: 'participated' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('publisher_reports')
    col.fields.removeByName('participated')
    app.save(col)
  },
)
