migrate(
  (app) => {
    const collection = new Collection({
      name: 'monthly_summaries',
      type: 'base',
      listRule: "@request.auth.role = 'Secretário'",
      viewRule: "@request.auth.role = 'Secretário'",
      createRule: "@request.auth.role = 'Secretário'",
      updateRule: "@request.auth.role = 'Secretário'",
      deleteRule: "@request.auth.role = 'Secretário'",
      fields: [
        { name: 'month', type: 'text', required: true },
        { name: 'year', type: 'number', required: true },
        { name: 'total_active_publishers', type: 'number', required: true },
        { name: 'avg_attendance_midweek', type: 'number', required: true },
        { name: 'avg_attendance_weekend', type: 'number', required: true },
        { name: 'report_data', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_monthly_summaries_period ON monthly_summaries (month, year)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('monthly_summaries')
    app.delete(collection)
  },
)
