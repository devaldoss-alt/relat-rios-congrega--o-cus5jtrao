migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = "id = @request.auth.id || @request.auth.role = 'Secretário'"
    users.viewRule = "id = @request.auth.id || @request.auth.role = 'Secretário'"
    users.createRule =
      "id = @request.auth.id || @request.auth.role = 'Secretário' || @request.auth.id = ''"
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'Secretário'"
    users.deleteRule = "id = @request.auth.id || @request.auth.role = 'Secretário'"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
