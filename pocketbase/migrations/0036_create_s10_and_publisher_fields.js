migrate(
  (app) => {
    // 1. Atualizar a coleção publishers com novos campos
    const publishersCol = app.findCollectionByNameOrId('publishers')
    if (!publishersCol.fields.getByName('is_deaf')) {
      publishersCol.fields.add(new BoolField({ name: 'is_deaf' }))
    }
    if (!publishersCol.fields.getByName('is_blind')) {
      publishersCol.fields.add(new BoolField({ name: 'is_blind' }))
    }
    if (!publishersCol.fields.getByName('is_prisoner')) {
      publishersCol.fields.add(new BoolField({ name: 'is_prisoner' }))
    }
    if (!publishersCol.fields.getByName('readmission_date')) {
      publishersCol.fields.add(new DateField({ name: 'readmission_date' }))
    }
    app.save(publishersCol)

    // 2. Criar coleção s10_reports
    try {
      app.findCollectionByNameOrId('s10_reports')
    } catch (_) {
      const s10Reports = new Collection({
        name: 's10_reports',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável'",
        updateRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável'",
        deleteRule: "@request.auth.role = 'Secretário'",
        fields: [
          { name: 'service_year', type: 'number', required: true, onlyInt: true },
          { name: 'avg_attendance_weekend', type: 'number', required: false },
          { name: 'avg_attendance_midweek', type: 'number', required: false },
          { name: 'total_active_publishers', type: 'number', required: false },
          { name: 'new_unbaptized_publishers', type: 'number', required: false },
          { name: 'reactivated_publishers', type: 'number', required: false },
          { name: 'deaf_publishers', type: 'number', required: false },
          { name: 'blind_publishers', type: 'number', required: false },
          { name: 'prisoner_publishers', type: 'number', required: false },
          { name: 'territory_cards_worked', type: 'number', required: false },
          { name: 'territory_percent_covered', type: 'number', required: false },
          { name: 'notes', type: 'text', required: false },
          {
            name: 'updated_by',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_s10_reports_year ON s10_reports (service_year)'],
      })
      app.save(s10Reports)
    }

    // 3. Criar coleção s10_territories (apenas estrutura para controle individual futuro)
    try {
      app.findCollectionByNameOrId('s10_territories')
    } catch (_) {
      const s10Territories = new Collection({
        name: 's10_territories',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável'",
        updateRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável'",
        deleteRule: "@request.auth.role = 'Secretário'",
        fields: [
          { name: 'number', type: 'text', required: true },
          { name: 'name', type: 'text', required: false },
          { name: 'service_year', type: 'number', required: false, onlyInt: true },
          { name: 'work_date', type: 'date', required: false },
          { name: 'coverage_percent', type: 'number', required: false },
          { name: 'status', type: 'text', required: false },
          { name: 'notes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_s10_territories_year ON s10_territories (service_year)'],
      })
      app.save(s10Territories)
    }
  },
  (app) => {
    try {
      const terr = app.findCollectionByNameOrId('s10_territories')
      app.delete(terr)
    } catch (_) {}

    try {
      const rep = app.findCollectionByNameOrId('s10_reports')
      app.delete(rep)
    } catch (_) {}

    try {
      const publishersCol = app.findCollectionByNameOrId('publishers')
      publishersCol.fields.removeByName('is_deaf')
      publishersCol.fields.removeByName('is_blind')
      publishersCol.fields.removeByName('is_prisoner')
      publishersCol.fields.removeByName('readmission_date')
      app.save(publishersCol)
    } catch (_) {}
  },
)
