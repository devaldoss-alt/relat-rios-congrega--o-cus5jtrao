migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('devaldoss@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Administrador')
      app.save(admin)
    }

    const membersCol = app.findCollectionByNameOrId('members')
    if (app.countRecords('members') === 0) {
      const members = [
        {
          name: 'João Silva',
          status: 'Ativo',
          phone: '(11) 98888-1111',
          baptism_date: '2015-04-12 10:00:00.000Z',
        },
        {
          name: 'Maria Oliveira',
          status: 'Ativo',
          phone: '(11) 97777-2222',
          baptism_date: '2018-08-20 10:00:00.000Z',
        },
        { name: 'Carlos Santos', status: 'Visitante', phone: '(11) 96666-3333' },
      ]
      for (const m of members) {
        const rec = new Record(membersCol)
        rec.set('name', m.name)
        rec.set('status', m.status)
        if (m.phone) rec.set('phone', m.phone)
        if (m.baptism_date) rec.set('baptism_date', m.baptism_date)
        app.save(rec)
      }
    }

    const reportsCol = app.findCollectionByNameOrId('reports')
    if (app.countRecords('reports') === 0) {
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const reports = [
        {
          type: 'Culto de Domingo',
          attendance: 120,
          visitors: 5,
          meeting_date: now.toISOString().replace('T', ' '),
          notes: 'Culto abençoado',
        },
        {
          type: 'Culto de Domingo',
          attendance: 115,
          visitors: 2,
          meeting_date: lastWeek.toISOString().replace('T', ' '),
          notes: 'Santa Ceia',
        },
        {
          type: 'Jovens',
          attendance: 45,
          visitors: 8,
          meeting_date: now.toISOString().replace('T', ' '),
          notes: 'Culto Jovem',
        },
      ]
      for (const r of reports) {
        const rec = new Record(reportsCol)
        rec.set('type', r.type)
        rec.set('attendance', r.attendance)
        rec.set('visitors', r.visitors)
        rec.set('meeting_date', r.meeting_date)
        rec.set('notes', r.notes)
        app.save(rec)
      }
    }

    const finCol = app.findCollectionByNameOrId('finances')
    if (app.countRecords('finances') === 0) {
      const now = new Date()
      const finances = [
        {
          type: 'Entrada',
          category: 'Dízimos e Ofertas',
          amount: 4500.0,
          description: 'Culto de Domingo',
          transaction_date: now.toISOString().replace('T', ' '),
        },
        {
          type: 'Saída',
          category: 'Energia',
          amount: 350.0,
          description: 'Conta de luz (Mês atual)',
          transaction_date: now.toISOString().replace('T', ' '),
        },
        {
          type: 'Saída',
          category: 'Manutenção',
          amount: 150.0,
          description: 'Conserto do som',
          transaction_date: now.toISOString().replace('T', ' '),
        },
      ]
      for (const f of finances) {
        const rec = new Record(finCol)
        rec.set('type', f.type)
        rec.set('category', f.category)
        rec.set('amount', f.amount)
        rec.set('description', f.description)
        rec.set('transaction_date', f.transaction_date)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
