migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Ativo', 'Inativo (Apoio)', 'Mudou-se', 'Removido'],
        maxSelect: 1,
      }),
    )
    app.save(col)

    // Data migration for existing records
    app
      .db()
      .newQuery(`UPDATE publishers SET status = 'Ativo' WHERE active = true OR active IS NULL`)
      .execute()
    app
      .db()
      .newQuery(`UPDATE publishers SET status = 'Inativo (Apoio)' WHERE active = false`)
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')
    col.fields.removeByName('status')
    app.save(col)
  },
)
