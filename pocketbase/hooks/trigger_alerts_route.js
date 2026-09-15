routerAdd(
  'POST',
  '/backend/v1/trigger-alerts',
  (e) => {
    try {
      const alertsCol = $app.findCollectionByNameOrId('alerts')
      const now = new Date()
      const currentMonthNum = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const dayOfMonth = now.getDate()

      let prevM = currentMonthNum - 1
      let prevY = currentYear
      if (prevM === 0) {
        prevM = 12
        prevY -= 1
      }
      const prevMonthStr = prevY + '-' + (prevM < 10 ? '0' + prevM : '' + prevM)

      // 1. Grupos
      const groups = $app.findRecordsByFilter('groups', "id != ''", 'number', 100, 0)
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i]
        const gNum = g.getInt('number')
        const gLeaderId = g.getString('leader')

        let hasReport = false
        try {
          const rep = $app.findFirstRecordByFilter(
            'group_reports',
            'group_id = {:gid} && month = {:m}',
            { gid: g.id, m: prevMonthStr },
          )
          if (rep) hasReport = true
        } catch (_) {}

        if (!hasReport) {
          const alertTitle = 'Relatório de Grupo ' + gNum + ' Pendente (' + prevMonthStr + ')'
          let existingAlert = null
          try {
            existingAlert = $app.findFirstRecordByFilter(
              'alerts',
              "type = 'relatorio_pendente' && group_number = {:gNum} && reference_month = {:refMonth} && status = 'pendente'",
              { gNum: gNum, refMonth: prevMonthStr },
            )
          } catch (_) {}

          const severity = dayOfMonth > 6 ? 'critica' : dayOfMonth >= 4 ? 'alta' : 'media'
          const dueDate = new Date(currentYear, currentMonthNum - 1, 6, 23, 59, 59)
            .toISOString()
            .replace('T', ' ')
            .replace('Z', '.000Z')

          const desc =
            'O relatório mensal do Grupo ' +
            gNum +
            ' referente a ' +
            prevMonthStr +
            ' ainda não foi finalizado no sistema. Prazo regular: dia 06.'

          if (!existingAlert) {
            const newAlert = new Record(alertsCol)
            newAlert.set('title', alertTitle)
            newAlert.set('description', desc)
            newAlert.set('type', 'relatorio_pendente')
            newAlert.set('severity', severity)
            newAlert.set('status', 'pendente')
            newAlert.set('group_number', gNum)
            newAlert.set('group_id', g.id)
            if (gLeaderId) newAlert.set('responsible_user', gLeaderId)
            newAlert.set('due_date', dueDate)
            newAlert.set('reference_month', prevMonthStr)
            $app.save(newAlert)
          } else {
            existingAlert.set('severity', severity)
            existingAlert.set('description', desc)
            $app.save(existingAlert)
          }
        }
      }

      // 2. Publicadores 5 meses e 6+ meses
      const pubs = $app.findRecordsByFilter(
        'publishers',
        "status != 'Mudou-se' && status != 'Removido'",
        'name',
        500,
        0,
      )
      const minYearCheck = currentYear - 1
      const pReports = $app.findRecordsByFilter(
        'publisher_reports',
        'year >= {:minY}',
        '-year,-month',
        2000,
        0,
        { minY: minYearCheck },
      )

      for (let p = 0; p < pubs.length; p++) {
        const pub = pubs[p]
        const pubId = pub.id
        const pubName = pub.getString('name')
        const gId = pub.getString('group_id')

        let gNumber = 0
        for (let gIdx = 0; gIdx < groups.length; gIdx++) {
          if (groups[gIdx].id === gId) {
            gNumber = groups[gIdx].getInt('number')
            break
          }
        }

        let consecutiveMissed = 0
        for (let i = 0; i < 6; i++) {
          let m = currentMonthNum - 1 - i
          let y = currentYear
          while (m <= 0) {
            m += 12
            y -= 1
          }
          const mStr = m < 10 ? '0' + m : '' + m
          let foundParticipated = false
          for (let r = 0; r < pReports.length; r++) {
            const rep = pReports[r]
            if (
              rep.getString('publisher_id') === pubId &&
              rep.getString('month') === mStr &&
              rep.getInt('year') === y
            ) {
              if (rep.getBool('participated') || rep.getInt('hours') > 0) {
                foundParticipated = true
                break
              }
            }
          }
          if (foundParticipated) {
            break
          } else {
            consecutiveMissed++
          }
        }

        if (consecutiveMissed === 5) {
          let existing = null
          try {
            existing = $app.findFirstRecordByFilter(
              'alerts',
              "type = 'publicador_5_meses' && target_publisher = {:pubId} && status = 'pendente'",
              { pubId: pubId },
            )
          } catch (_) {}

          if (!existing) {
            const newAlert = new Record(alertsCol)
            newAlert.set(
              'title',
              'Alerta Preventivo: ' + pubName + ' sem relatar há 5 meses (Grupo ' + gNumber + ')',
            )
            newAlert.set(
              'description',
              pubName +
                ' está completando 5 meses consecutivos sem relatar. Atenção pastoral urgente recomendada.',
            )
            newAlert.set('type', 'publicador_5_meses')
            newAlert.set('severity', 'alta')
            newAlert.set('status', 'pendente')
            newAlert.set('group_number', gNumber)
            newAlert.set('group_id', gId)
            newAlert.set('target_publisher', pubId)
            $app.save(newAlert)
          }
        } else if (consecutiveMissed >= 6) {
          let existing = null
          try {
            existing = $app.findFirstRecordByFilter(
              'alerts',
              "type = 'publicador_6_meses_critico' && target_publisher = {:pubId} && status = 'pendente'",
              { pubId: pubId },
            )
          } catch (_) {}

          if (!existing) {
            const newAlert = new Record(alertsCol)
            newAlert.set(
              'title',
              'CRÍTICO: ' + pubName + ' há 6+ meses sem relatar — Inativo (Grupo ' + gNumber + ')',
            )
            newAlert.set(
              'description',
              pubName +
                ' não relata há 6+ meses e foi classificado como inativo pelo critério regular. Necessita pastoreio pelo corpo de anciãos.',
            )
            newAlert.set('type', 'publicador_6_meses_critico')
            newAlert.set('severity', 'critica')
            newAlert.set('status', 'pendente')
            newAlert.set('group_number', gNumber)
            newAlert.set('group_id', gId)
            newAlert.set('target_publisher', pubId)
            $app.save(newAlert)
          }
        }
      }

      // 3. Alerta de Prazo S-1
      if (dayOfMonth >= 1 && dayOfMonth <= 15) {
        let s1Alert = null
        try {
          s1Alert = $app.findFirstRecordByFilter(
            'alerts',
            "type = 'prazo_s1' && reference_month = {:ref} && status = 'pendente'",
            { ref: prevMonthStr },
          )
        } catch (_) {}

        const s1Due = new Date(currentYear, currentMonthNum - 1, 15, 23, 59, 59)
          .toISOString()
          .replace('T', ' ')
          .replace('Z', '.000Z')
        const s1Severity = dayOfMonth > 12 ? 'critica' : dayOfMonth >= 8 ? 'alta' : 'media'

        if (!s1Alert) {
          const newS1 = new Record(alertsCol)
          newS1.set(
            'title',
            'Prazo de Envio do Relatório S-1 a Betel (' +
              prevMonthStr +
              ') — Limite dia 15/' +
              currentMonthNum,
          )
          newS1.set(
            'description',
            'O secretário e os anciãos devem consolidar e transmitir a ficha S-1 a Betel até dia 15.',
          )
          newS1.set('type', 'prazo_s1')
          newS1.set('severity', s1Severity)
          newS1.set('status', 'pendente')
          newS1.set('due_date', s1Due)
          newS1.set('reference_month', prevMonthStr)
          $app.save(newS1)
        }
      }

      // 4. Ações de Atas
      const pendingActions = $app.findRecordsByFilter(
        'minutes_actions',
        "status = 'pendente' || status = 'em_andamento'",
        'due_date',
        100,
        0,
      )
      for (let a = 0; a < pendingActions.length; a++) {
        const act = pendingActions[a]
        const actDueDateStr = act.getString('due_date')
        if (!actDueDateStr) continue

        const actDueDate = new Date(actDueDateStr)
        const diffMs = actDueDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          let existing = null
          try {
            existing = $app.findFirstRecordByFilter(
              'alerts',
              "type = 'acao_ata_atrasada' && metadata ~ {:actId} && status = 'pendente'",
              { actId: act.id },
            )
          } catch (_) {}

          if (!existing) {
            const actAlert = new Record(alertsCol)
            actAlert.set(
              'title',
              'Ação de Ata Atrasada: "' +
                act.getString('title') +
                '" (' +
                Math.abs(diffDays) +
                'd)',
            )
            actAlert.set(
              'description',
              'A designação atribuída a ' +
                (act.getString('assigned_name') || 'Ancião') +
                ' venceu em ' +
                actDueDateStr.substring(0, 10) +
                ' e requer atualização.',
            )
            actAlert.set('type', 'acao_ata_atrasada')
            actAlert.set('severity', 'alta')
            actAlert.set('status', 'pendente')
            const assignedId = act.getString('assigned_to')
            if (assignedId) actAlert.set('responsible_user', assignedId)
            actAlert.set('due_date', actDueDateStr)
            actAlert.set('metadata', JSON.stringify({ action_id: act.id }))
            $app.save(actAlert)
          }
        }
      }

      // 5. Visitas de pastoreio atrasadas e agendadas
      try {
        const scheduledVisits = $app.findRecordsByFilter(
          'pastoral_visits',
          "status = 'agendada'",
          'scheduled_date',
          200,
          0,
        )

        for (let v = 0; v < scheduledVisits.length; v++) {
          const visit = scheduledVisits[v]
          const vDateStr = visit.getString('scheduled_date')
          if (!vDateStr) continue

          const vDate = new Date(vDateStr)
          const targetPubId = visit.getString('target_publisher')
          let targetPubName = visit.getString('target_family_name') || 'Irmão/Família'
          let targetPubPhone = ''
          let targetGroupNumber = 0
          let targetGroupId = ''

          if (targetPubId) {
            try {
              const pRec = $app.findRecordById('publishers', targetPubId)
              if (pRec) {
                targetPubName = pRec.getString('name')
                targetPubPhone = pRec.getString('phone')
                targetGroupId = pRec.getString('group_id')
                if (targetGroupId) {
                  try {
                    const gRec = $app.findRecordById('groups', targetGroupId)
                    if (gRec) targetGroupNumber = gRec.getInt('number')
                  } catch (_) {}
                }
              }
            } catch (_) {}
          }

          const primaryElderId = visit.getString('primary_elder')
          let elderName = 'Corpo de Anciãos'
          let elderPhone = ''
          let elderEmail = ''
          if (primaryElderId) {
            try {
              const uRec = $app.findRecordById('_pb_users_auth_', primaryElderId)
              if (uRec) {
                elderName = uRec.getString('name') || elderName
                elderPhone = uRec.getString('phone')
                elderEmail = uRec.getString('email')
              }
            } catch (_) {}
          }

          const diffMs = vDate.getTime() - now.getTime()
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          const topicStr = visit.getString('topic') || 'Encorajamento espiritual'

          if (diffDays < 0) {
            let existing = null
            try {
              existing = $app.findFirstRecordByFilter(
                'alerts',
                "type = 'visita_atrasada' && metadata ~ {:vId} && status = 'pendente'",
                { vId: visit.id },
              )
            } catch (_) {}

            const overdueDays = Math.abs(diffDays)
            const alertTitle =
              'Visita de Pastoreio Atrasada: ' + targetPubName + ' (' + overdueDays + 'd)'
            const alertDesc =
              'A visita de pastoreio com ' +
              targetPubName +
              ' estava agendada para ' +
              vDateStr.substring(0, 10) +
              ' e ainda não foi concluída. Responsável: ' +
              elderName +
              '. Pauta: ' +
              topicStr +
              '.'

            const waPhone = elderPhone || targetPubPhone
            let waLink = ''
            const waMsg =
              'Olá, irmão ' +
              elderName +
              '! Lembramos sobre a visita de pastoreio com ' +
              targetPubName +
              ' agendada para ' +
              vDateStr.substring(0, 10) +
              '. A visita já foi realizada para registrarmos o resumo no sistema?'
            if (waPhone) {
              let cleanPhone = waPhone.replace(/\\D/g, '')
              if (cleanPhone.length === 10 || cleanPhone.length === 11) {
                cleanPhone = '55' + cleanPhone
              }
              waLink = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(waMsg)
            } else {
              waLink = 'https://wa.me/?text=' + encodeURIComponent(waMsg)
            }

            if (!existing) {
              const vAlert = new Record(alertsCol)
              vAlert.set('title', alertTitle)
              vAlert.set('description', alertDesc)
              vAlert.set('type', 'visita_atrasada')
              vAlert.set('severity', overdueDays > 7 ? 'critica' : 'alta')
              vAlert.set('status', 'pendente')
              if (primaryElderId) vAlert.set('responsible_user', primaryElderId)
              if (targetPubId) vAlert.set('target_publisher', targetPubId)
              if (targetGroupId) vAlert.set('group_id', targetGroupId)
              if (targetGroupNumber) vAlert.set('group_number', targetGroupNumber)
              vAlert.set('due_date', vDateStr)
              vAlert.set('wa_link', waLink)
              vAlert.set(
                'metadata',
                JSON.stringify({
                  visit_id: visit.id,
                  target_name: targetPubName,
                  primary_elder: primaryElderId,
                  scheduled_date: vDateStr,
                }),
              )
              $app.save(vAlert)

              if (elderEmail) {
                try {
                  const message = new MailerMessage({
                    from: {
                      address: $app.settings().meta.senderAddress || 'relatorios@congregacao.local',
                      name: $app.settings().meta.senderName || 'Relatórios Congregação',
                    },
                    to: [{ address: elderEmail }],
                    subject: '[Aviso] ' + alertTitle,
                    html:
                      '<h3>' +
                      alertTitle +
                      '</h3><p>' +
                      alertDesc +
                      '</p><p>Favor atualizar a situação no Painel dos Anciãos ou registrar as observações pós-visita.</p>',
                  })
                  $app.newMailClient().send(message)
                } catch (_) {}
              }
            } else {
              existing.set('severity', overdueDays > 7 ? 'critica' : 'alta')
              existing.set('description', alertDesc)
              existing.set('wa_link', waLink)
              $app.save(existing)
            }
          } else if (diffDays <= 4) {
            let existing = null
            try {
              existing = $app.findFirstRecordByFilter(
                'alerts',
                "type = 'visita_agendada' && metadata ~ {:vId} && status = 'pendente'",
                { vId: visit.id },
              )
            } catch (_) {}

            const alertTitle =
              diffDays === 0
                ? 'Visita de Pastoreio Hoje: ' + targetPubName
                : 'Visita de Pastoreio em ' + diffDays + ' dia(s): ' + targetPubName
            const alertDesc =
              'Visita agendada para ' +
              vDateStr.substring(0, 10) +
              '. Responsável: ' +
              elderName +
              '. Pauta: ' +
              topicStr +
              '.'

            const waPhone = elderPhone || targetPubPhone
            let waLink = ''
            const waMsg =
              'Olá, irmão ' +
              elderName +
              '! Lembrete da visita de pastoreio com ' +
              targetPubName +
              ' agendada para ' +
              vDateStr.substring(0, 10) +
              '. Pauta: ' +
              topicStr +
              '.'
            if (waPhone) {
              let cleanPhone = waPhone.replace(/\\D/g, '')
              if (cleanPhone.length === 10 || cleanPhone.length === 11) {
                cleanPhone = '55' + cleanPhone
              }
              waLink = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(waMsg)
            } else {
              waLink = 'https://wa.me/?text=' + encodeURIComponent(waMsg)
            }

            if (!existing) {
              const vAlert = new Record(alertsCol)
              vAlert.set('title', alertTitle)
              vAlert.set('description', alertDesc)
              vAlert.set('type', 'visita_agendada')
              vAlert.set('severity', diffDays <= 1 ? 'alta' : 'media')
              vAlert.set('status', 'pendente')
              if (primaryElderId) vAlert.set('responsible_user', primaryElderId)
              if (targetPubId) vAlert.set('target_publisher', targetPubId)
              if (targetGroupId) vAlert.set('group_id', targetGroupId)
              if (targetGroupNumber) vAlert.set('group_number', targetGroupNumber)
              vAlert.set('due_date', vDateStr)
              vAlert.set('wa_link', waLink)
              vAlert.set(
                'metadata',
                JSON.stringify({
                  visit_id: visit.id,
                  target_name: targetPubName,
                  primary_elder: primaryElderId,
                  scheduled_date: vDateStr,
                }),
              )
              $app.save(vAlert)
            }
          }
        }
      } catch (visitErr) {
        console.error('trigger-alerts pastoral_visits error:', visitErr)
      }

      return e.json(200, { success: true, message: 'Alertas gerados e verificados com sucesso!' })
    } catch (err) {
      return e.json(500, { success: false, error: String(err) })
    }
  },
  $apis.requireAuth(),
)
