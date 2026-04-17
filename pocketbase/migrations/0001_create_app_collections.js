migrate(
  (app) => {
    const reports = new Collection({
      name: 'reports',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'meeting_date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Culto de Domingo', 'Reunião de Oração', 'Jovens', 'Estudo Bíblico', 'Outro'],
          maxSelect: 1,
        },
        { name: 'attendance', type: 'number', required: true, min: 0 },
        { name: 'visitors', type: 'number', min: 0 },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_reports_date ON reports (meeting_date)'],
    })
    app.save(reports)

    const finances = new Collection({
      name: 'finances',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'transaction_date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Entrada', 'Saída'],
          maxSelect: 1,
        },
        { name: 'category', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_finances_date ON finances (transaction_date)'],
    })
    app.save(finances)

    const members = new Collection({
      name: 'members',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo', 'Visitante'],
          maxSelect: 1,
        },
        { name: 'baptism_date', type: 'date' },
        { name: 'phone', type: 'text' },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_members_name ON members (name)'],
    })
    app.save(members)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('members'))
    app.delete(app.findCollectionByNameOrId('finances'))
    app.delete(app.findCollectionByNameOrId('reports'))
  },
)
