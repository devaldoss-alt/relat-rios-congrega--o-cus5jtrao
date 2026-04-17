migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')

    if (!col.fields.getByName('phone')) {
      col.fields.add(new TextField({ name: 'phone' }))
    }
    if (!col.fields.getByName('address')) {
      col.fields.add(new TextField({ name: 'address' }))
    }
    if (!col.fields.getByName('notes')) {
      col.fields.add(new TextField({ name: 'notes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')

    col.fields.removeByName('phone')
    col.fields.removeByName('address')
    col.fields.removeByName('notes')

    app.save(col)
  },
)
