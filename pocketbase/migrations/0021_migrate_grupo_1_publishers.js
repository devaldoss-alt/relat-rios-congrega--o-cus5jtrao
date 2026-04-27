migrate(
  (app) => {
    const groups = app.findCollectionByNameOrId('groups')
    let group1
    try {
      group1 = app.findFirstRecordByData('groups', 'number', 1)
    } catch (e) {
      console.log('Group 1 not found')
      return
    }

    const publishersData = [
      {
        name: 'Carlos Miguel da Silva Pinheiro',
        birth_date: '2011-06-01 12:00:00.000Z',
        baptism_date: '2025-02-23 12:00:00.000Z',
        gender: 'Masculino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Devaldo dos Santos Silva',
        birth_date: '1979-10-10 12:00:00.000Z',
        baptism_date: '2005-04-02 12:00:00.000Z',
        gender: 'Masculino',
        hope: 'Outras ovelhas',
        is_elder: true,
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, hours: 7, bible_studies: 5, participated: true },
          { month: '10', year: 2025, hours: 4, bible_studies: 0, participated: true },
          { month: '11', year: 2025, hours: 3, bible_studies: 0, participated: true },
          { month: '12', year: 2025, hours: 3, bible_studies: 0, participated: true },
        ],
      },
      {
        name: 'Eliana Lopes da Silva',
        birth_date: '1982-05-13 12:00:00.000Z',
        baptism_date: '2016-04-30 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, bible_studies: 1, participated: true },
          { month: '10', year: 2025, bible_studies: 1, participated: true },
          { month: '11', year: 2025, bible_studies: 1, participated: true },
          { month: '12', year: 2025, bible_studies: 1, participated: true },
        ],
      },
      {
        name: 'Eliene Maria Gomes dos Santos Reis',
        birth_date: '1952-09-16 12:00:00.000Z',
        baptism_date: '1994-01-08 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Sângela Correia Silva',
        birth_date: '1997-01-22 12:00:00.000Z',
        baptism_date: '2000-01-30 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Mary Rosas Costa Araujo',
        birth_date: '1997-09-24 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Iriel Rocha Santos',
        birth_date: '1957-06-08 12:00:00.000Z',
        baptism_date: '1994-04-23 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Dória de Jesus',
        birth_date: '1962-05-10 12:00:00.000Z',
        baptism_date: '2021-11-14 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Izidório Vaz de Oliveira Neto',
        birth_date: '1988-12-23 12:00:00.000Z',
        baptism_date: '2011-08-13 12:00:00.000Z',
        gender: 'Masculino',
        hope: 'Outras ovelhas',
        type: 'pioneiro_regular',
        reports: [
          { month: '09', year: 2025, hours: 66, participated: true },
          { month: '10', year: 2025, hours: 68, participated: true },
          { month: '11', year: 2025, hours: 62, participated: true },
          { month: '12', year: 2025, hours: 69, participated: true },
        ],
      },
      {
        name: 'Jandira Sousa Cardoso',
        birth_date: '1951-03-19 12:00:00.000Z',
        baptism_date: '1970-12-19 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Lilian Raquel Sousa Cardoso dos Reis',
        birth_date: '1983-10-20 12:00:00.000Z',
        baptism_date: '2000-11-19 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, bible_studies: 1, participated: true },
          { month: '10', year: 2025, bible_studies: 1, participated: true },
          { month: '11', year: 2025, bible_studies: 1, participated: true },
          { month: '12', year: 2025, bible_studies: 0, participated: true },
        ],
      },
      {
        name: 'Marilian Almeida Matias Weber',
        birth_date: '1979-11-07 12:00:00.000Z',
        baptism_date: '2018-07-28 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, bible_studies: 1, participated: true },
          { month: '10', year: 2025, bible_studies: 1, participated: true },
          { month: '11', year: 2025, bible_studies: 1, participated: true },
          { month: '12', year: 2025, bible_studies: 0, participated: true },
        ],
      },
      {
        name: 'Emberg Weber da Silva',
        birth_date: '1979-03-24 12:00:00.000Z',
        baptism_date: '2019-08-10 12:00:00.000Z',
        gender: 'Masculino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, bible_studies: 2, participated: true },
          { month: '10', year: 2025, bible_studies: 2, participated: true },
          { month: '11', year: 2025, bible_studies: 1, participated: true },
          { month: '12', year: 2025, bible_studies: 1, participated: true },
        ],
      },
      {
        name: 'Marivalda de Jesus Cerqueira',
        birth_date: '1959-08-24 12:00:00.000Z',
        baptism_date: '2013-08-16 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
      {
        name: 'Maria Nilda Libarino da Silva',
        aliases: ['Nilda Libarino'],
        birth_date: '1974-10-22 12:00:00.000Z',
        baptism_date: '2016-08-27 12:00:00.000Z',
        gender: 'Feminino',
        hope: 'Outras ovelhas',
        type: 'publicador',
        reports: [
          { month: '09', year: 2025, hours: 28, type: 'pioneiro_auxiliar', participated: true },
          { month: '10', year: 2025, participated: true },
          { month: '11', year: 2025, participated: true },
          { month: '12', year: 2025, participated: true },
        ],
      },
    ]

    const pubCollection = app.findCollectionByNameOrId('publishers')
    const repCollection = app.findCollectionByNameOrId('publisher_reports')

    for (const p of publishersData) {
      let pubRecord

      try {
        pubRecord = app.findFirstRecordByData('publishers', 'name', p.name)
      } catch (e) {
        if (p.aliases) {
          for (const alias of p.aliases) {
            try {
              pubRecord = app.findFirstRecordByData('publishers', 'name', alias)
              if (pubRecord) break
            } catch (err) {}
          }
        }
      }

      if (!pubRecord) {
        pubRecord = new Record(pubCollection)
        pubRecord.set('group_id', group1.id)
        pubRecord.set('active', true)
      }

      pubRecord.set('name', p.name)
      pubRecord.set('type', p.type || 'publicador')

      if (p.birth_date) {
        pubRecord.set('birth_date', p.birth_date)
      }

      if (p.baptism_date) {
        pubRecord.set('baptism_date', p.baptism_date)
      } else {
        pubRecord.set('baptism_date', '')
      }

      if (p.gender) pubRecord.set('gender', p.gender)
      if (p.hope) pubRecord.set('hope', p.hope)

      if (p.is_elder) {
        pubRecord.set('is_elder', true)
      } else {
        pubRecord.set('is_elder', false)
      }

      app.save(pubRecord)

      for (const r of p.reports) {
        let repRecord
        try {
          const records = app.findRecordsByFilter(
            'publisher_reports',
            "publisher_id = '" +
              pubRecord.id +
              "' && month = '" +
              r.month +
              "' && year = " +
              r.year,
            '',
            1,
            0,
          )
          if (records && records.length > 0) {
            repRecord = records[0]
          } else {
            throw new Error('not found')
          }
        } catch (e) {
          repRecord = new Record(repCollection)
          repRecord.set('publisher_id', pubRecord.id)
          repRecord.set('month', r.month)
          repRecord.set('year', r.year)
        }

        if (r.hours !== undefined) repRecord.set('hours', r.hours)
        if (r.bible_studies !== undefined) repRecord.set('bible_studies', r.bible_studies)
        if (r.participated !== undefined) repRecord.set('participated', r.participated)

        if (r.type !== undefined) {
          repRecord.set('type', r.type)
        } else {
          repRecord.set('type', p.type || 'publicador')
        }

        app.save(repRecord)
      }
    }
  },
  (app) => {
    app
      .db()
      .newQuery(
        "DELETE FROM publisher_reports WHERE year = 2025 AND month IN ('09', '10', '11', '12')",
      )
      .execute()
  },
)
