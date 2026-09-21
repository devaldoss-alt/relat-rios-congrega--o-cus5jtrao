migrate(
  (app) => {
    const publishersCol = app.findCollectionByNameOrId('publishers')
    if (!publishersCol.fields.getByName('first_report_date')) {
      publishersCol.fields.add(new DateField({ name: 'first_report_date' }))
    }
    if (!publishersCol.fields.getByName('reactivation_date')) {
      publishersCol.fields.add(new DateField({ name: 'reactivation_date' }))
    }
    app.save(publishersCol)
  },
  (app) => {
    try {
      const publishersCol = app.findCollectionByNameOrId('publishers')
      publishersCol.fields.removeByName('first_report_date')
      publishersCol.fields.removeByName('reactivation_date')
      app.save(publishersCol)
    } catch (_) {}
  },
)
