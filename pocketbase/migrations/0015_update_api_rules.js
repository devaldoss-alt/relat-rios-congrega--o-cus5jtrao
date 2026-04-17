migrate(
  (app) => {
    const groups = app.findCollectionByNameOrId('groups')
    const groupsRule =
      "@request.auth.id != '' && (number = @request.auth.group_number || @request.auth.role = 'Secretário')"
    groups.listRule = groupsRule
    groups.viewRule = groupsRule
    app.save(groups)

    const publishers = app.findCollectionByNameOrId('publishers')
    const publishersRule =
      "@request.auth.id != '' && (group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário')"
    publishers.listRule = publishersRule
    publishers.viewRule = publishersRule
    publishers.createRule = publishersRule
    publishers.updateRule = publishersRule
    publishers.deleteRule = publishersRule
    app.save(publishers)

    const groupReports = app.findCollectionByNameOrId('group_reports')
    groupReports.listRule = publishersRule
    groupReports.viewRule = publishersRule
    groupReports.createRule = publishersRule
    groupReports.updateRule = publishersRule
    groupReports.deleteRule = publishersRule
    app.save(groupReports)

    const publisherReports = app.findCollectionByNameOrId('publisher_reports')
    const publisherReportsRule =
      "@request.auth.id != '' && (publisher_id.group_id.number = @request.auth.group_number || @request.auth.role = 'Secretário')"
    publisherReports.listRule = publisherReportsRule
    publisherReports.viewRule = publisherReportsRule
    publisherReports.createRule = publisherReportsRule
    publisherReports.updateRule = publisherReportsRule
    publisherReports.deleteRule = publisherReportsRule
    app.save(publisherReports)
  },
  (app) => {
    const groups = app.findCollectionByNameOrId('groups')
    const oldGroupsRule =
      "@request.auth.id != '' && (leader = @request.auth.id || @request.auth.role = 'Secretário')"
    groups.listRule = oldGroupsRule
    groups.viewRule = oldGroupsRule
    app.save(groups)

    const publishers = app.findCollectionByNameOrId('publishers')
    const oldPublishersRule =
      "@request.auth.id != '' && (group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')"
    publishers.listRule = oldPublishersRule
    publishers.viewRule = oldPublishersRule
    publishers.createRule = oldPublishersRule
    publishers.updateRule = oldPublishersRule
    publishers.deleteRule = oldPublishersRule
    app.save(publishers)

    const groupReports = app.findCollectionByNameOrId('group_reports')
    groupReports.listRule = oldPublishersRule
    groupReports.viewRule = oldPublishersRule
    groupReports.createRule = oldPublishersRule
    groupReports.updateRule = oldPublishersRule
    groupReports.deleteRule = oldPublishersRule
    app.save(groupReports)

    const publisherReports = app.findCollectionByNameOrId('publisher_reports')
    const oldPublisherReportsRule =
      "@request.auth.id != '' && (publisher_id.group_id.leader = @request.auth.id || @request.auth.role = 'Secretário')"
    publisherReports.listRule = oldPublisherReportsRule
    publisherReports.viewRule = oldPublisherReportsRule
    publisherReports.createRule = oldPublisherReportsRule
    publisherReports.updateRule = oldPublisherReportsRule
    publisherReports.deleteRule = oldPublisherReportsRule
    app.save(publisherReports)
  },
)
