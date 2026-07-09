routerAdd(
  'POST',
  '/backend/v1/admin/update-user/{id}',
  (e) => {
    const authRole = e.auth?.getString('role')
    if (authRole !== 'Secretário') {
      return e.forbiddenError('Apenas o Secretário pode atualizar usuários')
    }

    const id = e.request.pathValue('id')
    if (!id) {
      return e.badRequestError('ID do usuário é obrigatório')
    }

    let record
    try {
      record = $app.findRecordById('users', id)
    } catch (err) {
      return e.notFoundError('Usuário não encontrado')
    }

    const body = e.requestInfo().body || {}

    if (body.name !== undefined && body.name !== '') {
      record.set('name', body.name)
    }

    if (body.email !== undefined && body.email !== '') {
      let emailInUse = false
      try {
        const existing = $app.findAuthRecordByEmail('users', body.email)
        if (existing.id !== id) {
          emailInUse = true
        }
      } catch (err) {}

      if (emailInUse) {
        const errors = {}
        errors.email = new ValidationError('validation_not_unique', 'Email já está em uso.')
        throw new BadRequestError('Dados inválidos', errors)
      }
      record.setEmail(body.email)
    }

    if (body.role !== undefined && body.role !== '') {
      const validRoles = ['Secretário', 'Responsável']
      if (!validRoles.includes(body.role)) {
        const errors = {}
        errors.role = new ValidationError('validation_invalid_value', 'Função inválida.')
        throw new BadRequestError('Dados inválidos', errors)
      }
      record.set('role', body.role)
    }

    if (body.group_name !== undefined && body.group_name !== '') {
      const validGroups = ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4']
      if (!validGroups.includes(body.group_name)) {
        const errors = {}
        errors.group_name = new ValidationError('validation_invalid_value', 'Grupo inválido.')
        throw new BadRequestError('Dados inválidos', errors)
      }
      record.set('group_name', body.group_name)
    }

    if (body.group_number !== undefined && body.group_number !== null) {
      const groupNum =
        typeof body.group_number === 'number' ? body.group_number : parseInt(body.group_number, 10)
      if (!isNaN(groupNum)) {
        record.set('group_number', groupNum)
      }
    }

    if (body.emailVisibility !== undefined) {
      record.set('emailVisibility', body.emailVisibility)
    }

    if (body.password !== undefined && body.password !== '') {
      if (typeof body.password !== 'string' || body.password.length < 10) {
        const errors = {}
        errors.password = new ValidationError(
          'validation_min_text_constraint',
          'A senha deve ter pelo menos 10 caracteres.',
        )
        throw new BadRequestError('Dados inválidos', errors)
      }
      record.setPassword(body.password)
    }

    try {
      $app.save(record)
    } catch (err) {
      return e.badRequestError('Erro ao salvar usuário: ' + (err.message || 'Falha de validação'))
    }

    return e.json(200, { success: true, id: record.id })
  },
  $apis.requireAuth(),
)
