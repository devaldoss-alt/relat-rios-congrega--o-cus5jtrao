migrate(
  (app) => {
    const collections = ['monthly_summaries', 'publisher_reports', 'group_reports']

    for (const collName of collections) {
      try {
        const records = app.findRecordsByFilter(collName, "month != ''", '', 10000, 0)
        for (const record of records) {
          const month = record.getString('month')
          if (month && month.length === 1) {
            record.set('month', month.padStart(2, '0'))
            app.saveNoValidate(record)
          }
        }
      } catch (e) {
        console.log(`Failed to process ${collName}:`, e)
      }
    }
  },
  (app) => {
    // Revert not strictly necessary for data normalization
  },
)
