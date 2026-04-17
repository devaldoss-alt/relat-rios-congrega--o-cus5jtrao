migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('group_number')) {
      users.fields.add(new NumberField({ name: 'group_number', min: 1, max: 4 }))
    }
    app.save(users)

    const groups = new Collection({
      name: 'groups',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (leader = @request.auth.id || @request.auth.role = 'Secretário')",
      viewRule:
        "@request.auth.id != '' && (leader = @request.auth.id || @request.auth.role = 'Secretário')",
      createRule: "@request.auth.role = 'Secretário'",
      updateRule: "@request.auth.role = 'Secretário'",
      deleteRule: "@request.auth.role = 'Secretário'",
      fields: [
        { name: 'number', type: 'number', required: true },
        { name: 'leader', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(groups)

    const publishers = new Collection({
      name: 'publishers',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      viewRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      createRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      updateRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      deleteRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'group_id',
          type: 'relation',
          collectionId: groups.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          values: ['publicador', 'pioneiro_auxiliar', 'pioneiro_regular'],
          required: true,
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(publishers)

    const groupReports = new Collection({
      name: 'group_reports',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      viewRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      createRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      updateRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      deleteRule:
        "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')",
      fields: [
        {
          name: 'group_id',
          type: 'relation',
          collectionId: groups.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'month', type: 'text', required: true },
        { name: 'publishers_count', type: 'number' },
        { name: 'auxiliary_pioneers_count', type: 'number' },
        { name: 'regular_pioneers_count', type: 'number' },
        { name: 'publisher_hours', type: 'number' },
        { name: 'auxiliary_pioneer_hours', type: 'number' },
        { name: 'regular_pioneer_hours', type: 'number' },
        { name: 'publisher_bible_studies', type: 'number' },
        { name: 'auxiliary_pioneer_bible_studies', type: 'number' },
        { name: 'regular_pioneer_bible_studies', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(groupReports)

    const meetingAttendance = new Collection({
      name: 'meeting_attendance',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'Secretário'",
      updateRule: "@request.auth.role = 'Secretário'",
      deleteRule: "@request.auth.role = 'Secretário'",
      fields: [
        { name: 'meeting_date', type: 'date', required: true },
        { name: 'meeting_type', type: 'select', values: ['quinta', 'domingo'], required: true },
        { name: 'in_person', type: 'number', required: true },
        { name: 'zoom', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(meetingAttendance)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('meeting_attendance'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('group_reports'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('publishers'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('groups'))
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('group_number')
      app.save(users)
    } catch (_) {}
  },
)
