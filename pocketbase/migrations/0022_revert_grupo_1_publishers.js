migrate(
  (app) => {
    // Remove relatórios de setembro a dezembro de 2025 para publicadores do Grupo 1
    app
      .db()
      .newQuery(`
    DELETE FROM publisher_reports 
    WHERE year = 2025 
      AND month IN ('setembro', 'outubro', 'novembro', 'dezembro')
      AND publisher_id IN (
        SELECT id FROM publishers 
        WHERE group_id IN (SELECT id FROM groups WHERE number = 1)
      )
  `)
      .execute()

    // Limpa campos suplementares adicionados na última migração para o Grupo 1
    app
      .db()
      .newQuery(`
    UPDATE publishers 
    SET 
      phone = '',
      address = '',
      notes = '',
      birth_date = '',
      baptism_date = '',
      gender = '',
      hope = '',
      is_elder = 0,
      is_ministerial_servant = 0,
      is_special_pioneer = 0,
      is_field_missionary = 0
    WHERE group_id IN (SELECT id FROM groups WHERE number = 1)
  `)
      .execute()

    // Restaura nome específico mencionado nos critérios de aceite
    app
      .db()
      .newQuery(`
    UPDATE publishers 
    SET name = 'Nilda Libarino' 
    WHERE name = 'Maria Nilda Libarino da Silva'
  `)
      .execute()
  },
  (app) => {
    // Reversão de uma deleção em lote não é possível sem backup dos dados
  },
)
