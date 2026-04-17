migrate(
  (app) => {
    const publishersCol = app.findCollectionByNameOrId('publishers')

    const groupsData = [
      {
        number: 1,
        names: [
          'Ângela Cerqueira',
          'Carlos Miguel Pinheiro',
          'Devaldo Silva (Dirigente)',
          'Eliana Lopes',
          'Eliene Reis',
          'Elisangela Silva',
          'Fátima Oliveira',
          'Hillary Rosas',
          'Isabel Rocha',
          'Isidório Neto',
          'Izidória Fernandes',
          'Jandira Cardoso',
          'Lílian Raquel Cardoso',
          'Lincoln Cid Nunesmaia',
          'Luiz Fernando Andrade',
          'Marilian Weber',
          'Marivalda Cerqueira',
          'Nilda Libarino',
          'Willemberg Weber (Ajudante)',
        ],
      },
      {
        number: 2,
        names: [
          'ADRIANA SILVA',
          'ANA PAULA PEREIRA',
          'ANÁLIA MENEZES',
          'ANNE CAROLINE MIRANDA',
          'CAMILA SOARES',
          'CID NUNESMAIA FILHO',
          'DAVI SANTOS',
          'ELIENE GONÇALVES NUNESMAIA',
          'ÉRICO DE SANTANA',
          'FRANCISCA GOMES',
          'JOSÉ AILTON SIMÕES',
          'KATIANE SANTANA',
          'KELTA CHRISANGELA COUTO',
          'LINDINALVA NUNES',
          'LÚCIA DE JESUS SOARES',
          'MARIA GOMES BRITO SILVA',
          'MARINA LUISE BARBOSA MIRANDA',
          'MARLI CERQUEIRA',
          'MIRIAN SANTOS',
          'RICARDO JORGE SILVA',
          'RICARDO VALENÇA',
        ],
      },
      {
        number: 3,
        names: [
          'Adriana Castro',
          'Alai Paixão',
          'Alexia Vitória',
          'Aline Sabina dos S',
          'Arivaldo Castro',
          'Elizabete de Jesus',
          'Emanuel Carvalho',
          'Francisco Cláudio',
          'Honorina Bonfim',
          'Jailton Santos',
          'Joelma Carvalho',
          'Josélio Paixão',
          'Luana Rodrigues',
          'Maria Antonia Castro',
          'Maria José',
          'Nicole Lima',
          'Renato Weber',
          'Rosa Paixão',
          'Tatiana Ramos',
        ],
      },
      {
        number: 4,
        names: [
          'ANTONIO CARLOS SOUZA P GOMES',
          'CHARLES ANTONIO DOS SANTOS CRUZ',
          'CHARLES DE ANDRADE CRUZ',
          'DARLETE SILVA MORAES',
          'GILMAR BATISTA',
          'GLEIDIANE DE JESUS SANTOS',
          'GLEIDSON DE JESUS GOMES',
          'IRLAN IRAKTAN MARTINS',
          'IVANA CLARA DE OLIVEIRA M. DOS SANTOS',
          'IVANILDA MARCELINO',
          'JANAINA LEÃO GOMES',
          'MARIA GRAÇA ROSARIO',
          'PRISCILA VIEIRA',
          'SAMANTA PRAZERES GOMS',
          'SUELY CRUZ',
          'VAGNO VIEIRA DOS S. GOMES',
          'VILCINÉIA RAMOS',
        ],
      },
    ]

    for (const group of groupsData) {
      let groupRecord
      try {
        groupRecord = app.findFirstRecordByData('groups', 'number', group.number)
      } catch (_) {
        console.log(
          'Group ' + group.number + ' not found, skipping publishers seed for this group.',
        )
        continue
      }

      for (const name of group.names) {
        try {
          app.findFirstRecordByData('publishers', 'name', name)
        } catch (_) {
          const record = new Record(publishersCol)
          record.set('name', name)
          record.set('group_id', groupRecord.id)
          record.set('type', 'publicador')
          record.set('active', true)
          app.save(record)
        }
      }
    }
  },
  (app) => {
    const allNames = [
      'Ângela Cerqueira',
      'Carlos Miguel Pinheiro',
      'Devaldo Silva (Dirigente)',
      'Eliana Lopes',
      'Eliene Reis',
      'Elisangela Silva',
      'Fátima Oliveira',
      'Hillary Rosas',
      'Isabel Rocha',
      'Isidório Neto',
      'Izidória Fernandes',
      'Jandira Cardoso',
      'Lílian Raquel Cardoso',
      'Lincoln Cid Nunesmaia',
      'Luiz Fernando Andrade',
      'Marilian Weber',
      'Marivalda Cerqueira',
      'Nilda Libarino',
      'Willemberg Weber (Ajudante)',
      'ADRIANA SILVA',
      'ANA PAULA PEREIRA',
      'ANÁLIA MENEZES',
      'ANNE CAROLINE MIRANDA',
      'CAMILA SOARES',
      'CID NUNESMAIA FILHO',
      'DAVI SANTOS',
      'ELIENE GONÇALVES NUNESMAIA',
      'ÉRICO DE SANTANA',
      'FRANCISCA GOMES',
      'JOSÉ AILTON SIMÕES',
      'KATIANE SANTANA',
      'KELTA CHRISANGELA COUTO',
      'LINDINALVA NUNES',
      'LÚCIA DE JESUS SOARES',
      'MARIA GOMES BRITO SILVA',
      'MARINA LUISE BARBOSA MIRANDA',
      'MARLI CERQUEIRA',
      'MIRIAN SANTOS',
      'RICARDO JORGE SILVA',
      'RICARDO VALENÇA',
      'Adriana Castro',
      'Alai Paixão',
      'Alexia Vitória',
      'Aline Sabina dos S',
      'Arivaldo Castro',
      'Elizabete de Jesus',
      'Emanuel Carvalho',
      'Francisco Cláudio',
      'Honorina Bonfim',
      'Jailton Santos',
      'Joelma Carvalho',
      'Josélio Paixão',
      'Luana Rodrigues',
      'Maria Antonia Castro',
      'Maria José',
      'Nicole Lima',
      'Renato Weber',
      'Rosa Paixão',
      'Tatiana Ramos',
      'ANTONIO CARLOS SOUZA P GOMES',
      'CHARLES ANTONIO DOS SANTOS CRUZ',
      'CHARLES DE ANDRADE CRUZ',
      'DARLETE SILVA MORAES',
      'GILMAR BATISTA',
      'GLEIDIANE DE JESUS SANTOS',
      'GLEIDSON DE JESUS GOMES',
      'IRLAN IRAKTAN MARTINS',
      'IVANA CLARA DE OLIVEIRA M. DOS SANTOS',
      'IVANILDA MARCELINO',
      'JANAINA LEÃO GOMES',
      'MARIA GRAÇA ROSARIO',
      'PRISCILA VIEIRA',
      'SAMANTA PRAZERES GOMS',
      'SUELY CRUZ',
      'VAGNO VIEIRA DOS S. GOMES',
      'VILCINÉIA RAMOS',
    ]

    for (const name of allNames) {
      try {
        const record = app.findFirstRecordByData('publishers', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
