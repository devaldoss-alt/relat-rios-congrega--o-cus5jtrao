migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')
    col.fields.add(new DateField({ name: 'birth_date' }))
    col.fields.add(new DateField({ name: 'baptism_date' }))
    col.fields.add(
      new SelectField({ name: 'gender', values: ['Masculino', 'Feminino'], maxSelect: 1 }),
    )
    col.fields.add(
      new SelectField({ name: 'hope', values: ['Outras ovelhas', 'Ungido'], maxSelect: 1 }),
    )
    col.fields.add(new BoolField({ name: 'is_elder' }))
    col.fields.add(new BoolField({ name: 'is_ministerial_servant' }))
    col.fields.add(new BoolField({ name: 'is_special_pioneer' }))
    col.fields.add(new BoolField({ name: 'is_field_missionary' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('publishers')
    col.fields.removeByName('birth_date')
    col.fields.removeByName('baptism_date')
    col.fields.removeByName('gender')
    col.fields.removeByName('hope')
    col.fields.removeByName('is_elder')
    col.fields.removeByName('is_ministerial_servant')
    col.fields.removeByName('is_special_pioneer')
    col.fields.removeByName('is_field_missionary')
    app.save(col)
  },
)
