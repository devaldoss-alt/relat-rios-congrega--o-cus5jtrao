migrate(
  (app) => {
    // 1. Atualizar opções de 'role' em users para incluir 'Ancião'
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['Secretário', 'Responsável', 'Ancião']
      roleField.maxSelect = 1
      app.save(users)
    }

    // 2. Atualizar regras de acesso para permitir Ancião visualizar tudo
    // Grupos
    const groups = app.findCollectionByNameOrId('groups')
    groups.listRule =
      "@request.auth.id != '' && (number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    groups.viewRule =
      "@request.auth.id != '' && (number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    app.save(groups)

    // Publishers
    const publishers = app.findCollectionByNameOrId('publishers')
    publishers.listRule =
      "@request.auth.id != '' && (group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    publishers.viewRule =
      "@request.auth.id != '' && (group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    // Create/update/delete permanecem restritos ao Secretário e dirigentes dos grupos (Ancião apenas consulta)
    app.save(publishers)

    // Group Reports
    const groupReports = app.findCollectionByNameOrId('group_reports')
    groupReports.listRule =
      "@request.auth.id != '' && (group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    groupReports.viewRule =
      "@request.auth.id != '' && (group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    app.save(groupReports)

    // Publisher Reports
    const publisherReports = app.findCollectionByNameOrId('publisher_reports')
    publisherReports.listRule =
      "@request.auth.id != '' && (publisher_id.group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    publisherReports.viewRule =
      "@request.auth.id != '' && (publisher_id.group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião')"
    app.save(publisherReports)

    // Users collection listRule/viewRule
    users.listRule =
      "id = @request.auth.id || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'"
    users.viewRule =
      "id = @request.auth.id || @request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'"
    app.save(users)

    // Deliberative Reports
    try {
      const deliberativeReports = app.findCollectionByNameOrId('deliberative_reports')
      deliberativeReports.listRule =
        "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'"
      deliberativeReports.viewRule =
        "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'"
      app.save(deliberativeReports)
    } catch (_) {}

    // 3. Criar coleção 'alerts'
    try {
      app.findCollectionByNameOrId('alerts')
    } catch (_) {
      const alerts = new Collection({
        name: 'alerts',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        updateRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        deleteRule: "@request.auth.role = 'Secretário'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text', required: false },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: [
              'relatorio_pendente',
              'publicador_5_meses',
              'publicador_6_meses_critico',
              'prazo_s1',
              'acao_ata_vencendo',
              'acao_ata_atrasada',
              'pastoreio',
              'geral',
            ],
            maxSelect: 1,
          },
          {
            name: 'severity',
            type: 'select',
            required: true,
            values: ['baixa', 'media', 'alta', 'critica'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'resolvido'],
            maxSelect: 1,
          },
          { name: 'group_number', type: 'number', required: false },
          {
            name: 'group_id',
            type: 'relation',
            required: false,
            collectionId: groups.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'responsible_user',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'target_publisher',
            type: 'relation',
            required: false,
            collectionId: publishers.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'due_date', type: 'date', required: false },
          { name: 'reference_month', type: 'text', required: false },
          { name: 'wa_link', type: 'text', required: false },
          { name: 'metadata', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(alerts)
    }

    // 4. Criar coleção 'meeting_minutes' (Atas e decisões de reuniões de anciãos)
    let minutesId = ''
    try {
      const existing = app.findCollectionByNameOrId('meeting_minutes')
      minutesId = existing.id
    } catch (_) {
      const minutes = new Collection({
        name: 'meeting_minutes',
        type: 'base',
        listRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        viewRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        createRule: "@request.auth.role = 'Secretário'",
        updateRule: "@request.auth.role = 'Secretário'",
        deleteRule: "@request.auth.role = 'Secretário'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'meeting_date', type: 'date', required: true },
          { name: 'raw_content', type: 'text', required: false },
          {
            name: 'attachment',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
          },
          {
            name: 'created_by',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(minutes)
      minutesId = minutes.id
    }

    // 5. Criar coleção 'minutes_actions' (Plano de Ação derivado das atas)
    try {
      app.findCollectionByNameOrId('minutes_actions')
    } catch (_) {
      const actions = new Collection({
        name: 'minutes_actions',
        type: 'base',
        listRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        viewRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        createRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        updateRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        deleteRule: "@request.auth.role = 'Secretário'",
        fields: [
          {
            name: 'minute_id',
            type: 'relation',
            required: false,
            collectionId: minutesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text', required: false },
          {
            name: 'assigned_to',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'assigned_name', type: 'text', required: false },
          { name: 'group_number', type: 'number', required: false },
          { name: 'due_date', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'em_andamento', 'concluido', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'priority',
            type: 'select',
            required: true,
            values: ['baixa', 'media', 'alta', 'urgente'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text', required: false },
          { name: 'completed_at', type: 'date', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(actions)
    }
  },
  (app) => {
    try {
      const actions = app.findCollectionByNameOrId('minutes_actions')
      app.delete(actions)
    } catch (_) {}
    try {
      const minutes = app.findCollectionByNameOrId('meeting_minutes')
      app.delete(minutes)
    } catch (_) {}
    try {
      const alerts = app.findCollectionByNameOrId('alerts')
      app.delete(alerts)
    } catch (_) {}
  },
)
