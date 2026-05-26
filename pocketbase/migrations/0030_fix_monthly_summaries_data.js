migrate(
  (app) => {
    const summaries = app.findRecordsByFilter('monthly_summaries', '1=1', '', 10000, 0)

    for (const summary of summaries) {
      const year = summary.getInt('year')
      const monthStr = summary.getString('month')

      const reports = app.findRecordsByFilter(
        'publisher_reports',
        `year = ${year} && month = '${monthStr}'`,
        '',
        10000,
        0,
      )

      const report_data = {
        publishers: { reports: 0, hours: 0, studies: 0 },
        auxiliary: { reports: 0, hours: 0, studies: 0 },
        regular: { reports: 0, hours: 0, studies: 0 },
      }

      for (const r of reports) {
        const type = r.getString('type') || 'publicador'
        const participated = r.getBool('participated')
        const hours = r.getInt('hours')
        const studies = r.getInt('bible_studies')

        const didParticipate = participated || hours > 0

        if (type === 'pioneiro_regular') {
          if (didParticipate) report_data.regular.reports++
          report_data.regular.hours += hours
          report_data.regular.studies += studies
        } else if (type === 'pioneiro_auxiliar') {
          if (didParticipate) report_data.auxiliary.reports++
          report_data.auxiliary.hours += hours
          report_data.auxiliary.studies += studies
        } else {
          if (didParticipate) report_data.publishers.reports++
          report_data.publishers.hours += hours
          report_data.publishers.studies += studies
        }
      }

      summary.set('report_data', report_data)
      app.saveNoValidate(summary)
    }
  },
  (app) => {
    // Empty revert for fix migration
  },
)
