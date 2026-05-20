migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('monthly_summaries')

    const f1 = col.fields.getByName('total_active_publishers')
    if (f1) f1.required = false

    const f2 = col.fields.getByName('avg_attendance_midweek')
    if (f2) f2.required = false

    const f3 = col.fields.getByName('avg_attendance_weekend')
    if (f3) f3.required = false

    const f4 = col.fields.getByName('report_data')
    if (f4) f4.required = false

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('monthly_summaries')

    const f1 = col.fields.getByName('total_active_publishers')
    if (f1) f1.required = true

    const f2 = col.fields.getByName('avg_attendance_midweek')
    if (f2) f2.required = true

    const f3 = col.fields.getByName('avg_attendance_weekend')
    if (f3) f3.required = true

    const f4 = col.fields.getByName('report_data')
    if (f4) f4.required = true

    app.save(col)
  },
)
