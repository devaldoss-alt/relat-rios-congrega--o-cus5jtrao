migrate(
  (app) => {
    const summaries = app.findCollectionByNameOrId('monthly_summaries')
    if (!summaries.fields.getByName('attendance_goal')) {
      summaries.fields.add(new NumberField({ name: 'attendance_goal' }))
    }
    app.save(summaries)

    const groups = app.findCollectionByNameOrId('groups')
    if (!groups.fields.getByName('regular_pioneer_hour_goal')) {
      groups.fields.add(new NumberField({ name: 'regular_pioneer_hour_goal' }))
    }
    app.save(groups)
  },
  (app) => {
    const summaries = app.findCollectionByNameOrId('monthly_summaries')
    summaries.fields.removeByName('attendance_goal')
    app.save(summaries)

    const groups = app.findCollectionByNameOrId('groups')
    groups.fields.removeByName('regular_pioneer_hour_goal')
    app.save(groups)
  },
)
