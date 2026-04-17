migrate(
  (app) => {
    const collection = new Collection({
      name: 'publisher_reports',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      viewRule:
        "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      createRule:
        "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      updateRule:
        "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      deleteRule:
        "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      fields: [
        {
          name: 'publisher_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('publishers').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'month', type: 'text', required: true },
        { name: 'year', type: 'number', required: true },
        { name: 'hours', type: 'number', required: false },
        { name: 'bible_studies', type: 'number', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_publisher_reports_unique ON publisher_reports (publisher_id, month, year)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('publisher_reports')
    app.delete(collection)
  },
)
