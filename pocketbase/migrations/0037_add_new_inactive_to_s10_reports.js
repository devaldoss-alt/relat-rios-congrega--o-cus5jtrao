migrate(
  (app) => {
    const s10Reports = app.findCollectionByNameOrId('s10_reports')
    if (!s10Reports.fields.getByName('new_inactive_publishers')) {
      s10Reports.fields.add(new NumberField({ name: 'new_inactive_publishers', required: false }))
    }
    app.save(s10Reports)
  },
  (app) => {
    try {
      const s10Reports = app.findCollectionByNameOrId('s10_reports')
      s10Reports.fields.removeByName('new_inactive_publishers')
      app.save(s10Reports)
    } catch (_) {}
  },
)
