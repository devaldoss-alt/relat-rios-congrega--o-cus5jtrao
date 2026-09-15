migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const publishers = app.findCollectionByNameOrId('publishers')

    try {
      app.findCollectionByNameOrId('pastoral_visits')
    } catch (_) {
      const visits = new Collection({
        name: 'pastoral_visits',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule:
          "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável' || @request.auth.role = 'Ancião'",
        updateRule:
          "@request.auth.role = 'Secretário' || @request.auth.role = 'Responsável' || @request.auth.role = 'Ancião'",
        deleteRule: "@request.auth.role = 'Secretário' || @request.auth.role = 'Ancião'",
        fields: [
          {
            name: 'target_publisher',
            type: 'relation',
            required: false,
            collectionId: publishers.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'target_family_name',
            type: 'text',
            required: false,
          },
          {
            name: 'responsible_elders',
            type: 'relation',
            required: false,
            collectionId: users.id,
            cascadeDelete: false,
            maxSelect: 10,
          },
          {
            name: 'primary_elder',
            type: 'relation',
            required: false,
            collectionId: users.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'scheduled_date',
            type: 'date',
            required: true,
          },
          {
            name: 'topic',
            type: 'text',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['agendada', 'realizada', 'cancelada'],
            maxSelect: 1,
          },
          {
            name: 'completion_date',
            type: 'date',
            required: false,
          },
          {
            name: 'notes',
            type: 'text',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_pastoral_visits_date ON pastoral_visits (scheduled_date DESC)',
          'CREATE INDEX idx_pastoral_visits_status ON pastoral_visits (status)',
        ],
      })
      app.save(visits)
    }

    // Atualizar tipos da coleção de alerts se necessário para suportar 'visita_agendada' e 'visita_atrasada'
    try {
      const alertsCol = app.findCollectionByNameOrId('alerts')
      const typeField = alertsCol.fields.getByName('type')
      if (typeField) {
        const existingValues = typeField.values || []
        const needed = ['visita_agendada', 'visita_atrasada']
        let changed = false
        for (let i = 0; i < needed.length; i++) {
          if (!existingValues.includes(needed[i])) {
            existingValues.push(needed[i])
            changed = true
          }
        }
        if (changed) {
          typeField.values = existingValues
          app.save(alertsCol)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const visits = app.findCollectionByNameOrId('pastoral_visits')
      app.delete(visits)
    } catch (_) {}
  },
)
