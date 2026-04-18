migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('groups')
    if (!collection.fields.getByName('hour_goal')) {
      collection.fields.add(new NumberField({ name: 'hour_goal', min: 0 }))
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('groups')
    collection.fields.removeByName('hour_goal')
    app.save(collection)
  },
)
