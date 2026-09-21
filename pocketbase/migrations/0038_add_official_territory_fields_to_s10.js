migrate(
  (app) => {
    const s10Reports = app.findCollectionByNameOrId('s10_reports')
    if (!s10Reports.fields.getByName('total_territory_cards')) {
      s10Reports.fields.add(
        new NumberField({ name: 'total_territory_cards', required: false, min: 0, onlyInt: true }),
      )
    }
    if (!s10Reports.fields.getByName('unworked_territory_cards')) {
      s10Reports.fields.add(
        new NumberField({
          name: 'unworked_territory_cards',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }
    app.save(s10Reports)
  },
  (app) => {
    try {
      const s10Reports = app.findCollectionByNameOrId('s10_reports')
      s10Reports.fields.removeByName('total_territory_cards')
      s10Reports.fields.removeByName('unworked_territory_cards')
      app.save(s10Reports)
    } catch (_) {}
  },
)
