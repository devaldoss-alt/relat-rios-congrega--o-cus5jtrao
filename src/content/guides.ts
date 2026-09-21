export interface GuideStep {
  title: string
  description: string
  tip?: string
}

export interface ModuleGuide {
  id: string
  route: string
  title: string
  subtitle: string
  iconName: string // e.g., 'LayoutDashboard', 'Users', 'ClipboardList', etc.
  purpose: string
  targetRoles: string[]
  sections: {
    name: string
    description: string
  }[]
  steps: GuideStep[]
  commonActions: {
    action: string
    howTo: string
  }[]
  tips: string[]
}

export interface GettingStartedGuide {
  title: string
  subtitle: string
  overview: string
  roles: {
    role: string
    badge: string
    description: string
    mainDuties: string[]
  }[]
  monthlyCycle: {
    step: number
    title: string
    deadline: string
    responsible: string
    description: string
  }[]
  goldenRules: string[]
}

export const GETTING_STARTED: GettingStartedGuide = {
  title: 'Primeiros Passos no Relatórios Congregação',
  subtitle: 'Visão geral do sistema, perfis de acesso e o ciclo mensal de relatórios',
  overview:
    'O sistema Relatórios Congregação foi desenvolvido para auxiliar o corpo de anciãos e os responsáveis de grupo de serviço de campo a organizar, registrar e acompanhar os relatórios de atividade ministerial e o pastoreio espiritual do rebanho de forma simples, segura e pontual.',
  roles: [
    {
      role: 'Secretário',
      badge: 'Acesso Administrativo Completo',
      description:
        'Responsável por consolidar os relatórios de todos os grupos, emitir a Ficha S-1 oficial para envio a Betel até o dia 15 do mês, manter o cadastro de publicadores (S-21-T) e gerenciar os usuários do sistema.',
      mainDuties: [
        'Acompanhar o fechamento de relatórios de todos os grupos no início do mês',
        'Consolidar a Ficha S-1 e enviar os dados para Betel',
        'Cadastrar novos publicadores e manter os cartões S-21-T atualizados',
        'Cadastrar e atribuir permissões aos responsáveis de grupo e anciãos',
      ],
    },
    {
      role: 'Responsável (Dirigente de Grupo)',
      badge: 'Acesso ao Grupo Designado',
      description:
        'Responsável por coletar a atividade de cada publicador e pioneiro do seu grupo no fim do mês, lançar os dados na tela "Entrada de Dados" e fechar o grupo nos primeiros dias úteis.',
      mainDuties: [
        'Coletar os relatórios de serviço de campo dos publicadores do seu grupo',
        'Lançar horas, estudos e participação individual na Entrada de Dados',
        'Verificar pendências em vermelho e confirmar o fechamento mensal',
        'Acompanhar publicadores que necessitam de incentivo e visitas de pastoreio',
      ],
    },
    {
      role: 'Ancião',
      badge: 'Consulta e Acompanhamento Pastoral',
      description:
        'Acesso total de consulta para pastoreio da congregação. Acompanha o Painel dos Anciãos, a saúde espiritual do rebanho, publicadores irregulares/inativos, reuniões com atas e o agendamento de visitas de pastoreio.',
      mainDuties: [
        'Consultar o Painel dos Anciãos e a lista de ovelhas que necessitam de cuidado pastoral',
        'Planejar e registrar visitas de pastoreio com o rebanho',
        'Acompanhar as decisões e pendências das atas de reuniões do corpo de anciãos',
        'Consultar gráficos de assistência às reuniões e métricas de saúde espiritual',
      ],
    },
  ],
  monthlyCycle: [
    {
      step: 1,
      title: 'Coleta e Lançamento dos Relatórios de Campo',
      deadline: 'Do dia 1º ao dia 5 de cada mês',
      responsible: 'Responsáveis de Grupo',
      description:
        'Cada dirigente de grupo coleta os relatórios individuais dos publicadores e pioneiros, acessa a página "Entrada de Dados" e marca a participação, horas e estudos de cada um.',
    },
    {
      step: 2,
      title: 'Fechamento do Grupo e Verificação de Alertas',
      deadline: 'Até o dia 6 de cada mês',
      responsible: 'Responsáveis de Grupo e Secretário',
      description:
        'Ao salvar os lançamentos, o sistema totaliza automaticamente os dados do grupo. A Central de Avisos e o Painel dos Anciãos mostram se restam publicadores pendentes ou grupos não fechados.',
    },
    {
      step: 3,
      title: 'Consolidação da Ficha S-1',
      deadline: 'Entre o dia 6 e 10 de cada mês',
      responsible: 'Secretário da Congregação',
      description:
        'Na tela "Compilação de Relatório", o Secretário confere os números totais (publicadores, pioneiros auxiliares e regulares, estudos e assistência média). Pode comparar em tempo real e corrigir qualquer divergência.',
    },
    {
      step: 4,
      title: 'Envio Oficial a Betel e Acompanhamento Pastoral',
      deadline: 'Impreterivelmente até o dia 15',
      responsible: 'Secretário e Corpo de Anciãos',
      description:
        'O Secretário transmite os dados consolidados do S-1 para Betel. Em seguida, os anciãos utilizam o Painel dos Anciãos e Visitas de Pastoreio para cuidar dos irmãos que não relataram no mês ou que enfrentam desânimo.',
    },
  ],
  goldenRules: [
    'Nunca deixe o lançamento para depois do dia 5 — quanto mais cedo os dirigentes fecham o grupo, mais tempo o Secretário tem para revisar e transmitir o S-1 com precisão.',
    'Publicadores batizados que relataram ao menos 15 minutos ou marcaram participação devem constar como "Participou". Para publicadores com limitações de idade ou saúde, a participação de 15 minutos já é válida.',
    'Irmãos transferidos devem ter o status alterado para "Mudou-se" para preservar as estatísticas. Publicadores "Removidos" (desassociados não arrependidos de pecados graves) não fazem mais parte da congregação, saem do registro ativo de publicadores e NÃO entram em contagens nem fotografias.',
    'As informações sobre visitas de pastoreio e atas são sigilosas e devem ser tratadas com zelo e amor cristão pelos irmãos designados.',
  ],
}

export const MODULE_GUIDES: Record<string, ModuleGuide> = {
  '/dashboard': {
    id: 'dashboard',
    route: '/dashboard',
    title: 'Dashboard Geral',
    subtitle: 'Visão panorâmica da atividade e progresso ministerial da congregação',
    iconName: 'LayoutDashboard',
    purpose:
      'Apresenta o resumo visual dos relatórios mensais, evolução de horas e estudos bíblicos, metas dos pioneiros regulares e lista preventiva de irmãos que podem precisar de atenção pastoral.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Filtro por Período e Grupo',
        description:
          'Permite escolher o intervalo de meses (ex: ano de serviço atual) e filtrar por um grupo específico ou ver a congregação inteira (para Secretário e Ancião).',
      },
      {
        name: 'Cards de Resumo do Mês',
        description:
          'Exibe o total de horas dedicadas, estudos bíblicos ativos e publicadores que participaram no mês de encerramento selecionado.',
      },
      {
        name: 'Gráficos de Tendência',
        description:
          'Linhas comparativas de horas gerais, horas de pioneiros regulares/auxiliares e assistência média às reuniões ao longo dos meses.',
      },
      {
        name: 'Acompanhamento dos Pioneiros Regulares',
        description:
          'Mostra o acumulado anual de horas de cada pioneiro em relação à meta de 600 horas do ano de serviço, com cálculo de horas restantes.',
      },
      {
        name: 'Atenção Pastoral Preventiva',
        description:
          'Alerta antecipado com nomes de publicadores que estão há 4 ou 5 meses sem relatar, permitindo visita antes que completem 6 meses (inatividade).',
      },
    ],
    steps: [
      {
        title: 'Selecione o Grupo e o Período',
        description:
          'No topo da página, ajuste o mês inicial e final para analisar tendências (ex: últimos 6 meses). Se você for Secretário ou Ancião, pode alternar entre "Todos os Grupos" ou um grupo específico.',
      },
      {
        title: 'Verifique os Gráficos de Produção Ministerial',
        description:
          'Observe as barras e linhas: compare o ritmo de horas e estudos. Passe o mouse sobre os pontos do gráfico para ver detalhes numéricos de cada mês.',
      },
      {
        title: 'Confira as Metas dos Pioneiros',
        description:
          'Role até a seção "Pioneiros Regulares - Acumulado Anual" para conferir se os pioneiros estão no ritmo para alcançar as 600 horas no ano de serviço.',
        tip: 'Passe o cursor sobre as barras para ver exatamente quantas horas faltam para a meta anual.',
      },
      {
        title: 'Exporte para PDF ou Excel se Necessário',
        description:
          'Utilize os botões "PDF" ou "Excel" no canto superior direito para gerar uma cópia impressa ou planilha dos dados filtrados.',
      },
    ],
    commonActions: [
      {
        action: 'Exportar dados para planilha Excel',
        howTo:
          'Clique no botão "Excel" no canto superior direito. Um arquivo CSV formatado com os dados do mês final será baixado.',
      },
      {
        action: 'Imprimir painel em PDF',
        howTo:
          'Clique no botão "PDF". A tela ajustará a formatação automaticamente para impressão limpa da folha.',
      },
      {
        action: 'Verificar publicadores em risco de inatividade',
        howTo:
          'Consulte o card "Atenção Pastoral Preventiva" no final do Dashboard para identificar quem está há 4 ou 5 meses sem relatório.',
      },
    ],
    tips: [
      'O ano de serviço das Testemunhas de Jeová inicia em 1º de setembro e vai até 31 de agosto do ano seguinte.',
      'Publicadores com status "Mudou-se" ou "Removido" não entram nas contagens para manter os números exatos. "Removidos" são pessoas que não se arrependeram de pecados graves e deixam de fazer parte da congregação.',
    ],
  },

  '/group-data': {
    id: 'group-data',
    route: '/group-data',
    title: 'Entrada de Dados do Grupo',
    subtitle: 'Lançamento mensal individual dos relatórios de campo dos publicadores',
    iconName: 'Users',
    purpose:
      'Tela de trabalho operacional onde o Responsável pelo grupo (ou o Secretário) insere as atividades individuais de cada publicador do grupo para o mês de serviço.',
    targetRoles: ['Secretário', 'Responsável'],
    sections: [
      {
        name: 'Seleção de Grupo, Mês e Ano',
        description:
          'Permite escolher qual mês e ano estão sendo lançados. O responsável visualiza automaticamente o seu grupo.',
      },
      {
        name: 'Metas do Grupo',
        description:
          'Exibe o progresso de horas do grupo em relação à meta cadastrada, atualizando a barra de progresso em tempo real.',
      },
      {
        name: 'Tabela de Publicadores do Grupo',
        description:
          'Lista nominal com caixas de seleção ("Participou"), campos numéricos para horas e estudos bíblicos, além de observações.',
      },
      {
        name: 'Barra Fixa de Salvamento',
        description:
          'Barra inferior que exibe a contagem de relatórios preenchidos, total de horas e botão "Salvar Relatórios".',
      },
    ],
    steps: [
      {
        title: 'Confira o Mês e Ano de Referência',
        description:
          'No topo, confirme se o mês selecionado é o mês que acabou de fechar (ex: no início de outubro, lança-se o mês de setembro).',
      },
      {
        title: 'Marque a Atividade de Cada Publicador',
        description:
          'Para publicadores comuns: se pregou no mês, marque a caixa "Participou". Caso tenha dirigido estudos, informe a quantidade.',
        tip: 'Para publicadores de congregação, a exigência de horas foi suspensa — basta marcar a caixa de participação se pregou.',
      },
      {
        title: 'Lance Horas de Pioneiros (Auxiliares e Regulares)',
        description:
          'Para quem estiver como Pioneiro Auxiliar (30h ou 15h em meses especiais) ou Pioneiro Regular (meta de 50h mensais), insira o total de horas e os estudos dirigidos.',
      },
      {
        title: 'Adicione Observações Relevantes se Houver',
        description:
          'No campo de observações, você pode anotar situações temporárias (ex: "Esteve internado", "Serviu como pioneiro auxiliar na congregação X").',
      },
      {
        title: 'Clique em "Salvar Relatórios"',
        description:
          'Ao terminar a digitação, clique no botão verde "Salvar Relatórios" na parte inferior. O sistema consolidará os números do grupo e atualizará os totais.',
      },
    ],
    commonActions: [
      {
        action: 'Como lançar quem pregou apenas alguns minutos (idosos/enfermos)',
        howTo: 'Basta marcar a caixa "Participou". Não é necessário preencher o campo horas.',
      },
      {
        action: 'Como saber se esqueci alguém do grupo',
        howTo:
          'Role a tabela: os publicadores que ainda não têm nenhuma caixa marcada ou horas preenchidas ficarão evidentes na contagem inferior.',
      },
      {
        action: 'Como corrigir um valor salvo por engano',
        howTo:
          'Selecione o mesmo mês e ano, altere o campo incorreto e clique novamente em "Salvar Relatórios". Os dados anteriores serão atualizados.',
      },
    ],
    tips: [
      'Salve periodicamente caso esteja lançando muitos publicadores ao mesmo tempo para não perder o preenchimento.',
      'O sistema avisa se o mês anterior do seu grupo ainda não foi fechado, garantindo continuidade no histórico.',
    ],
  },

  '/reports': {
    id: 'reports',
    route: '/reports',
    title: 'Compilação de Relatório (S-1)',
    subtitle: 'Consolidação oficial da congregação no formato Betel (Ficha S-1)',
    iconName: 'FileText',
    purpose:
      'Gera a compilação consolidada de toda a congregação no formato oficial do formulário S-1, separando publicadores, pioneiros auxiliares e pioneiros regulares, além da assistência média.',
    targetRoles: ['Secretário', 'Ancião'],
    sections: [
      {
        name: 'Aba "Gestão"',
        description:
          'Visão gerencial do Secretário: resumo dos números, progresso do mês, aviso de divergências entre lançamentos em tempo real e consolidação salva, e botão para sincronizar.',
      },
      {
        name: 'Aba "Ficha S-1"',
        description:
          'Visual idêntico ao formulário oficial S-1 enviado a Betel, com totais de relatórios, horas, estudos bíblicos e assistência às reuniões.',
      },
      {
        name: 'Botão "Copiar Dados para Betel"',
        description:
          'Copia instantaneamente um resumo formatado em texto para a área de transferência, ideal para colar diretamente no formulário jw.org ou enviar ao coordenador.',
      },
    ],
    steps: [
      {
        title: 'Selecione o Mês e Ano Desejado',
        description:
          'Selecione o mês de relatório que deseja consultar ou consolidar (ex: 09/2025).',
      },
      {
        title: 'Verifique se Há Divergências',
        description:
          'Se algum dirigente alterou dados após o fechamento, o sistema exibirá um alerta em amarelo com o botão "Sincronizar Totais". Clique nele para alinhar os números.',
      },
      {
        title: 'Confira a Ficha S-1',
        description:
          'Clique na aba "Ficha S-1" para visualizar o espelho do relatório oficial com todas as colunas somadas.',
      },
      {
        title: 'Copie os Dados para o Envio',
        description:
          'Clique em "Copiar Dados para Betel" para ter o texto pronto para inserção no sistema de Betel.',
      },
    ],
    commonActions: [
      {
        action: 'Sincronizar total de publicadores ativos',
        howTo:
          'Se aparecer um alerta de divergência entre o tempo real e o consolidado, clique no botão azul "Sincronizar Histórico" no topo do relatório.',
      },
      {
        action: 'Copiar o texto formatado para envio a Betel',
        howTo:
          'Na aba Ficha S-1, clique no botão "Copiar Dados para Betel". Cole onde desejar com Ctrl+V.',
      },
      {
        action: 'Filtrar por grupo para conferência pontual',
        howTo:
          'Utilize o seletor "Todos os Grupos" para isolar os totais de um único grupo de serviço de campo.',
      },
    ],
    tips: [
      'O prazo para inserção no jw.org é dia 15 de cada mês, mas a boa prática é consolidar até o dia 10 para evitar imprevistos.',
      'A média de assistência de fim de semana e de meio de semana é puxada automaticamente do módulo de Assistência às Reuniões.',
    ],
  },

  '/publishers': {
    id: 'publishers',
    route: '/publishers',
    title: 'Gestão de Publicadores',
    subtitle: 'Cadastro geral da congregação e cartões de registro (S-21-T)',
    iconName: 'Users',
    purpose:
      'Cadastro central de todos os membros da congregação. Permite incluir novos publicadores, editar dados pessoais, dados de batismo, privilégios teocráticos e imprimir fichas individuais ou listas de grupos.',
    targetRoles: ['Secretário', 'Ancião'],
    sections: [
      {
        name: 'Cards de Resumo',
        description:
          'Quantitativo de publicadores cadastrados, pioneiros auxiliares e pioneiros regulares em atividade.',
      },
      {
        name: 'Filtros Rápidos e Busca',
        description:
          'Busca por nome, filtro por grupo de serviço, tipo (publicador, pioneiro auxiliar, pioneiro regular) e estado (ativos vs arquivados/mudou-se).',
      },
      {
        name: 'Tabela de Membros',
        description:
          'Lista completa com status (Ativo, Pendente, Inativo), telefone, grupo, privilégios (Ancião, Servo) e botões de ação (Ver Perfil S-21-T, Editar, Excluir).',
      },
      {
        name: 'Impressão e Lançamento em Massa',
        description:
          'Recursos para o Secretário imprimir listas completas de grupos para os dirigentes e importar/cadastrar múltiplos publicadores de uma só vez.',
      },
    ],
    steps: [
      {
        title: 'Buscar ou Filtrar um Publicador',
        description:
          'Digite o nome no campo de busca ou selecione o grupo desejado para localizar rapidamente a ficha do irmão.',
      },
      {
        title: 'Cadastrar um Novo Publicador',
        description:
          'Clique em "+ Novo Publicador", preencha nome, grupo, sexo, datas de nascimento e batismo (ou marque "Não Batizado"), além de eventuais privilégios teocráticos.',
      },
      {
        title: 'Consultar o Perfil S-21-T',
        description:
          'Clique no ícone de "olho" na linha do publicador para abrir seu cartão de registro individual completo (S-21-T), com o histórico mensal de anos de serviço.',
      },
      {
        title: 'Imprimir Listas da Congregação',
        description:
          'Clique no botão "Imprimir Listas" para gerar relatórios formatados em folha A4 com os publicadores agrupados por grupo.',
      },
    ],
    commonActions: [
      {
        action: 'Como cadastrar um publicador não batizado',
        howTo:
          'Ao preencher a ficha, marque a opção "Não Batizado". O campo de data de batismo será desativado automaticamente.',
      },
      {
        action: 'Como transferir um publicador que se mudou',
        howTo:
          'Edite o publicador e altere o campo "Status" para "Mudou-se". Ele sairá da contagem ativa mas o histórico será preservado.',
      },
      {
        action: 'Como imprimir o cartão S-21-T individual',
        howTo:
          'Acesse o perfil do publicador clicando no ícone do olho e clique no botão "Imprimir S-21-T" no topo da tela.',
      },
    ],
    tips: [
      'Mantenha sempre os números de telefone atualizados — eles são usados para mensagens de WhatsApp e contato direto nos alertas.',
      'Publicadores com mais de 6 meses sem relatar são classificados pelo sistema como "Inativos" (nunca saem do registro congregacional). Quando voltam a relatar, são "Reativados" — o que não se confunde com readmissão.',
      'O campo "Data de Readmissão" é de uso EXCLUSIVO para reintegração formal de pessoas removidas (desassociadas) após arrependimento e aprovação formal do corpo de anciãos. Nunca utilize esse campo para publicadores inativos que voltaram a relatar.',
    ],
  },

  '/elders-panel': {
    id: 'elders-panel',
    route: '/elders-panel',
    title: 'Painel dos Anciãos',
    subtitle: 'Central de acompanhamento pastoral e liderança da congregação',
    iconName: 'Shield',
    purpose:
      'Painel de bordo exclusivo para o corpo de anciãos e secretário. Reúne métricas espirituais do rebanho, publicadores em risco de inatividade, ranking de pontualidade dos grupos, checklist semanal e ações pendentes.',
    targetRoles: ['Secretário', 'Ancião'],
    sections: [
      {
        name: 'Métricas Rápidas de Pastoreio',
        description:
          'Quantitativo de ovelhas que necessitam de cuidado (2 a 5 meses sem relatar), grupos com fechamento pendente, ações de atas em aberto e visitas de pastoreio agendadas.',
      },
      {
        name: 'Checklist Semanal do Ancião',
        description:
          'Lista dinâmica de prioridades para a semana: grupos pendentes de fechamento, visitas urgentes a coordenar e prazo de envio do S-1.',
      },
      {
        name: 'Ovelhas que Precisam de Cuidado',
        description:
          'Tabela com nomes dos irmãos que falharam relatório nos últimos meses, indicando quantos meses faltam para inatividade completa e botão direto para agendar visita.',
      },
      {
        name: 'Pontualidade e Fechamento dos Grupos',
        description:
          'Acompanhamento do percentual de publicadores que já entregaram relatório em cada grupo e contato via WhatsApp do dirigente.',
      },
      {
        name: 'Comparativo Mensal de Horas e Estudos',
        description:
          'Comparação do mês de referência com o mês anterior por grupo, destacando crescimento ou queda.',
      },
    ],
    steps: [
      {
        title: 'Revise o Checklist Semanal',
        description:
          'Ao acessar a tela, examine os itens do checklist no topo: identifique o que ainda precisa de atenção do corpo de anciãos.',
      },
      {
        title: 'Examine a Lista de Cuidado Pastoral',
        description:
          'Verifique os irmãos que estão com 2, 3, 4 ou 5 meses sem relatório. Esses publicadores necessitam de contato fraterno urgente.',
      },
      {
        title: 'Agende uma Visita com 1 Clique',
        description:
          'Ao lado do nome do publicador necessitado, clique no botão "Agendar Visita": o sistema abrirá o formulário de Visitas de Pastoreio já preenchido.',
      },
      {
        title: 'Monitore os Grupos no Início do Mês',
        description:
          'Entre os dias 1º e 6, confira a tabela de pontualidade. Se um grupo estiver com baixa adesão, envie uma mensagem amigável ao dirigente pelo botão WhatsApp.',
      },
    ],
    commonActions: [
      {
        action: 'Enviar WhatsApp de lembrete para o dirigente do grupo',
        howTo:
          'Na aba de pontualidade dos grupos, clique no botão verde de WhatsApp ao lado do nome do dirigente.',
      },
      {
        action: 'Agendar visita de pastoreio direto de um irmão em risco',
        howTo:
          'Na lista "Ovelhas que precisam de cuidado", clique no botão "Agendar Visita" na linha do publicador.',
      },
      {
        action: 'Ver quais irmãos faltam relatar em um grupo específico',
        howTo:
          'Acesse a aba "Visão por Grupo" e escolha o grupo no seletor para ver os nomes dos publicadores pendentes.',
      },
    ],
    tips: [
      'A intervenção pastoral fraterna no 3º ou 4º mês sem relatório evita que o irmão atinja os 6 meses e se torne formalmente inativo.',
      'O Painel dos Anciãos não altera relatórios — é uma tela estritamente pastoral e estratégica.',
    ],
  },

  '/visits': {
    id: 'visits',
    route: '/visits',
    title: 'Visitas de Pastoreio',
    subtitle: 'Planejamento, agendamento e registro de pastoreio espiritual',
    iconName: 'CalendarCheck',
    purpose:
      'Gerenciamento organizado das visitas de pastoreio realizadas pelos anciãos e servos ministeriais designados. Evita que famílias fiquem esquecidas e registra os assuntos tratados.',
    targetRoles: ['Secretário', 'Ancião', 'Responsável'],
    sections: [
      {
        name: 'Cards de Status',
        description:
          'Contadores de visitas agendadas, visitas realizadas e visitas atrasadas (que passaram da data prevista sem conclusão registrada).',
      },
      {
        name: 'Visão em Lista e em Calendário',
        description:
          'Permite visualizar as visitas em cards ordenados por data ou em uma grade de calendário mensal.',
      },
      {
        name: 'Filtros por Ancião, Grupo e Status',
        description: 'Filtre as visitas atribuídas a você ou a um grupo específico da congregação.',
      },
      {
        name: 'Modal de Registro e Conclusão',
        description:
          'Formulário para definir data, família/publicador, ancião principal, companheiro, pauta espiritual e anotações confidenciais.',
      },
    ],
    steps: [
      {
        title: 'Clique em "+ Agendar Visita"',
        description: 'No topo da página, clique no botão para abrir o formulário de agendamento.',
      },
      {
        title: 'Selecione o Publicador ou Família',
        description:
          'Escolha o publicador na lista suspensa (ou digite o nome da família no campo correspondente).',
      },
      {
        title: 'Defina a Data e os Anciãos Designados',
        description:
          'Escolha a data da visita, quem será o ancião principal e o segundo irmão (companheiro de visita).',
      },
      {
        title: 'Informe a Pauta Espiritual',
        description:
          'Descreva brevemente o objetivo da visita (ex: "Encorajamento espiritual", "Apoio após perda de familiar", "Incentivo aos pioneiros").',
      },
      {
        title: 'Conclua a Visita Após a Realização',
        description:
          'Após realizar a visita, clique no botão "Concluir" no card da visita, confirme a data realizada e adicione notas breves para referência futura.',
      },
    ],
    commonActions: [
      {
        action: 'Enviar detalhes da visita para o companheiro via WhatsApp',
        howTo:
          'No card da visita agendada, clique no botão de WhatsApp para gerar uma mensagem pronta com data, local e pauta.',
      },
      {
        action: 'Marcar visita como realizada',
        howTo:
          'Clique no botão verde "Concluir" no card da visita, insira notas breves sobre o resultado e confirme.',
      },
      {
        action: 'Ver visitas do mês no Calendário',
        howTo:
          'Alterne a aba no topo de "Lista" para "Calendário" para ver a distribuição dos compromissos ao longo dos dias.',
      },
    ],
    tips: [
      'Visitas agendadas cuja data já passou e não foram concluídas aparecem destacadas como "Atrasadas" para que o corpo de anciãos não perca o controle.',
      'As notas das visitas devem ser sempre construtivas, respeitando a privacidade dos irmãos.',
    ],
  },

  '/minutes': {
    id: 'minutes',
    route: '/minutes',
    title: 'Atas & Plano de Ação',
    subtitle: 'Registro das reuniões de anciãos e acompanhamento de designações',
    iconName: 'CheckSquare',
    purpose:
      'Ambiente sigiloso para registrar atas de reuniões do corpo de anciãos, visitas de superintendentes de circuito e reuniões de serviço, além de controlar tarefas e decisões atribuídas a cada irmão.',
    targetRoles: ['Secretário', 'Ancião'],
    sections: [
      {
        name: 'Registro de Atas (Secretário)',
        description:
          'Armazena o título, data, resumo das decisões e anexo opcional (PDF ou foto de documento manuscrito).',
      },
      {
        name: 'Plano de Ação (Tarefas e Designações)',
        description:
          'Itens de ação com responsável, prazo de conclusão, nível de prioridade (baixa, média, alta, urgente) e vínculo opcional a uma ata.',
      },
      {
        name: 'Filtros de Ações',
        description:
          'Alterne entre "Minhas Ações", "Todas", "Pendentes" ou "Concluídas" para focar nas suas designações pessoais.',
      },
    ],
    steps: [
      {
        title: 'Registrar Nova Ata (Apenas Secretário)',
        description:
          'Clique em "+ Nova Ata / Decisões", informe a data da reunião, o título de referência e cole o resumo das decisões tomadas pelo corpo.',
      },
      {
        title: 'Criar Item de Ação',
        description:
          'Clique em "+ Nova Ação / Designação", defina o título da tarefa, selecione o irmão responsável e a data limite de cumprimento.',
      },
      {
        title: 'Acompanhar Minhas Designações',
        description:
          'Clique na aba de filtro "Minhas Tarefas" para visualizar apenas os compromissos atribuídos a você.',
      },
      {
        title: 'Marcar Tarefa como Concluída',
        description:
          'Ao cumprir uma designação, clique no botão de status e marque como "Concluído". O sistema arquivará o item com registro de data.',
      },
    ],
    commonActions: [
      {
        action: 'Notificar o responsável de uma tarefa pelo WhatsApp',
        howTo:
          'No card da ação, clique no botão de WhatsApp para enviar mensagem direta com o título e prazo da tarefa.',
      },
      {
        action: 'Anexar um documento digitalizado à ata',
        howTo:
          'Ao registrar a ata, utilize o campo "Anexo" para subir um arquivo PDF ou imagem com as assinaturas.',
      },
      {
        action: 'Filtrar apenas pendências urgentes',
        howTo:
          'Selecione a visualização "Pendentes" e ordene por prioridade no topo da lista de ações.',
      },
    ],
    tips: [
      'Vincular itens de ação a uma ata específica ajuda o corpo a verificar na reunião seguinte se todas as deliberações anteriores foram cumpridas.',
      'Qualquer ancião pode criar tarefas de acompanhamento; a inclusão de atas formais é reservada ao Secretário.',
    ],
  },

  '/attendance': {
    id: 'attendance',
    route: '/attendance',
    title: 'Assistência às Reuniões',
    subtitle: 'Registro e histórico de presença presencial e via videoconferência',
    iconName: 'CalendarCheck',
    purpose:
      'Acompanhamento da assistência às reuniões de meio de semana (Vida e Ministério) e de fim de semana (Discurso Público e A Sentinela), com cálculo automático das médias mensais necessárias para a Ficha S-1.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Filtro por Ano',
        description:
          'Selecione o ano desejado para visualizar gráficos e tabelas de presença correspondentes.',
      },
      {
        name: 'Metas e Sincronização',
        description:
          'O Secretário pode sincronizar registros de reuniões e definir metas médias de assistência para a congregação.',
      },
      {
        name: 'Gráficos de Fim de Semana e Meio de Semana',
        description: 'Evolução da presença presencial vs. Zoom ao longo dos meses do ano.',
      },
      {
        name: 'Tabela Completa de Reuniões',
        description:
          'Relação detalhada reunião a reunião com data, tipo de reunião, número de presentes no Salão do Reino e pelo Zoom.',
      },
    ],
    steps: [
      {
        title: 'Selecione o Ano de Análise',
        description: 'No topo da página, escolha o ano calendário que deseja analisar.',
      },
      {
        title: 'Consulte as Médias Calculadas',
        description:
          'Observe os gráficos comparativos: eles mostram se a frequência ao Salão do Reino está crescendo ou diminuindo em relação aos meses anteriores.',
      },
      {
        title: 'Sincronize Dados (Secretário)',
        description:
          'Se houver novos registros importados da planilha ou aplicativo de som, clique no botão azul "Sincronizar".',
      },
      {
        title: 'Conferência na Tabela de Reuniões',
        description:
          'Role até a tabela inferior para conferir data por data a assistência de cada reunião realizada no mês.',
      },
    ],
    commonActions: [
      {
        action: 'Sincronizar assistência das reuniões',
        howTo:
          'O Secretário clica no botão "Sincronizar" no cabeçalho da página para recalcular as médias mensais.',
      },
      {
        action: 'Ver a média de assistência de um mês específico',
        howTo: 'Passe o mouse sobre a barra do mês correspondente no gráfico de assistência.',
      },
    ],
    tips: [
      'A média de assistência de fim de semana é um dos dados mais importantes solicitados por Betel na Ficha S-1.',
      'Reuniões de assembleia ou congresso não devem distorcer a média da congregação.',
    ],
  },

  '/metrics': {
    id: 'metrics',
    route: '/metrics',
    title: 'Métricas de Saúde Espiritual',
    subtitle: 'Indicadores estatísticos aprofundados e tendências da congregação',
    iconName: 'Activity',
    purpose:
      'Página analítica com diagnósticos avançados sobre a saúde espiritual da congregação: taxa de participação, estudos por publicador, proporção de pioneiros e lista de publicadores irregulares mês a mês.',
    targetRoles: ['Secretário', 'Ancião', 'Responsável'],
    sections: [
      {
        name: 'Filtro por Período e Grupo',
        description:
          'Permite analisar um trimestre, semestre ou o ano de serviço completo, filtrando por grupo de serviço.',
      },
      {
        name: 'Taxa de Participação e Estudos per Capita',
        description:
          'Percentual de publicadores ativos que participaram no ministério no mês e média de estudos bíblicos por publicador.',
      },
      {
        name: 'Gráfico de Irregulares com Lista Interativa',
        description:
          'Gráfico de barras indicando quantos publicadores não relataram em cada mês. Ao clicar na barra, os nomes dos irmãos são exibidos com busca.',
      },
      {
        name: 'Distribuição da Força de Trabalho',
        description:
          'Gráfico de pizza mostrando a proporção de publicadores comuns, pioneiros auxiliares e pioneiros regulares.',
      },
    ],
    steps: [
      {
        title: 'Defina o Período de Avaliação',
        description:
          'Escolha o mês inicial e final desejado para carregar as métricas comparativas.',
      },
      {
        title: 'Analise a Taxa de Participação',
        description:
          'Verifique se a congregação mantém taxa de participação acima de 90%, identificando eventuais quedas em períodos de férias ou feriados.',
      },
      {
        title: 'Investigue Meses com Muitos Irregulares',
        description:
          'No gráfico de irregulares, clique sobre a barra de qualquer mês para abrir a lista nominal dos publicadores que não participaram naquele período.',
      },
      {
        title: 'Acompanhe os Estudos Bíblicos',
        description:
          'Examine o gráfico de estudos bíblicos para identificar quem são os publicadores que estão dirigindo cursos bíblicos na congregação.',
      },
    ],
    commonActions: [
      {
        action: 'Ver a lista de nomes dos irregulares de um mês',
        howTo:
          'Clique sobre a barra do mês no gráfico "Publicadores Irregulares". A lista de nomes abrirá para consulta.',
      },
      {
        action: 'Consultar instrutores bíblicos da congregação',
        howTo:
          'Passe o mouse ou clique no gráfico de estudos bíblicos para ver o ranking de publicadores com estudos.',
      },
    ],
    tips: [
      'Um publicador torna-se "irregular" quando passa um mês inteiro sem participar do ministério, mesmo que tenha pregado no mês seguinte.',
      'Use esses dados na reunião trimestral de anciãos para planejar saídas de campo em áreas com menor participação.',
    ],
  },

  '/reports-history': {
    id: 'reports-history',
    route: '/reports-history',
    title: 'Histórico de Relatórios',
    subtitle: 'Arquivo histórico de fichas S-1 e relatórios de grupos passados',
    iconName: 'BookOpen',
    purpose:
      'Arquivo centralizado de todos os relatórios mensais já consolidados e fechados na congregação, permitindo consulta retroativa, conferência e impressão.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Grid de Meses Anteriores',
        description:
          'Cards organizados por mês e ano com o resumo de publicadores que relataram, total de horas e média de assistência.',
      },
      {
        name: 'Modal Detalhado do Relatório',
        description:
          'Ao clicar em qualquer card, abre a compilação completa com botões de impressão e conferência das categorias.',
      },
    ],
    steps: [
      {
        title: 'Localize o Mês Desejado',
        description:
          'Percorra a lista de meses salvos no histórico até encontrar o período que precisa consultar.',
      },
      {
        title: 'Abra os Detalhes do Mês',
        description:
          'Clique sobre o card do mês para abrir o modal com o espelho do relatório daquele período.',
      },
      {
        title: 'Imprima ou Exporte se Necessário',
        description:
          'Clique no botão "Imprimir / PDF" no topo do modal para obter uma versão impressa oficial daquele mês.',
      },
    ],
    commonActions: [
      {
        action: 'Comparar o mês atual com o mesmo mês do ano passado',
        howTo:
          'Abra o card correspondente do ano anterior no histórico e compare os totais de publicadores e horas com o mês presente.',
      },
      {
        action: 'Reimprimir uma ficha antiga do grupo',
        howTo: 'O responsável pelo grupo clica no card do mês e utiliza o botão "Imprimir / PDF".',
      },
    ],
    tips: [
      'Os dados do histórico são permanentes e servem para auditoria do circuito e relatórios do superintendente de circuito.',
    ],
  },

  '/deliberative-report': {
    id: 'deliberative-report',
    route: '/deliberative-report',
    title: 'Relatório Deliberativo',
    subtitle: 'Diagnóstico aprofundado e parecer espiritual para o corpo de anciãos',
    iconName: 'ClipboardList',
    purpose:
      'Ferramenta exclusiva do Secretário para gerar um documento formal de diagnóstico espiritual da congregação em um período (ex: semestre ou ano), com seções para parecer executivo, vitalidade espiritual, engajamento e prioridades de pastoreio.',
    targetRoles: ['Secretário'],
    sections: [
      {
        name: 'Seleção de Intervalo de Datas',
        description:
          'Define o início e o fim do período em análise para consolidação dos dados estatísticos.',
      },
      {
        name: '1. O Termômetro (Resumo Executivo)',
        description:
          'Indicadores sintéticos da saúde congregacional com campo para parecer em texto do Secretário.',
      },
      {
        name: '2. Vitalidade Espiritual e 3. Engajamento Presencial',
        description: 'Gráficos de atividade de campo e presença física nas reuniões.',
      },
      {
        name: '4. Prioridades de Pastoreio e 5. Desempenho de Pioneiros',
        description:
          'Identificação dos casos prioritários para pastoreio e ritmo de metas dos pioneiros.',
      },
      {
        name: 'Salvar e Imprimir Relatório',
        description:
          'Permite salvar versões deliberativas no banco de dados e imprimir com formatação pronta para apresentação na reunião de anciãos.',
      },
    ],
    steps: [
      {
        title: 'Defina a Data de Início e Fim',
        description:
          'Escolha o intervalo desejado (ex: últimos 6 meses) e clique no botão "Gerar".',
      },
      {
        title: 'Revise os Dados de Cada Seção',
        description:
          'Analise os gráficos e tabelas gerados automaticamente pelo sistema a partir dos lançamentos reais.',
      },
      {
        title: 'Escreva suas Observações e Diagnósticos',
        description:
          'Em cada bloco, preencha o campo de texto correspondente com observações que serão úteis para a consideração do corpo.',
      },
      {
        title: 'Salve e Imprima o Relatório',
        description:
          'Clique em "Salvar Relatório" para manter a versão arquivada e em "Imprimir PDF" para levar impresso à reunião.',
      },
    ],
    commonActions: [
      {
        action: 'Carregar um relatório deliberativo salvo anteriormente',
        howTo: 'Selecione o relatório salvo na lista suspensa "Carregar Salvo" no topo da página.',
      },
      {
        action: 'Imprimir o parecer completo para a reunião de anciãos',
        howTo:
          'Clique no botão "Imprimir PDF". O layout oculta elementos de navegação e formata em documento formal.',
      },
    ],
    tips: [
      'Esse relatório é ideal para ser preparado antes da visita do superintendente de circuito ou antes da reunião trimestral de anciãos.',
    ],
  },

  '/users': {
    id: 'users',
    route: '/users',
    title: 'Gestão de Usuários',
    subtitle: 'Administração de contas, senhas e permissões de acesso ao sistema',
    iconName: 'UserCog',
    purpose:
      'Módulo exclusivo do Secretário para cadastrar irmãos autorizados a utilizar o sistema, definir suas funções (Secretário, Responsável ou Ancião) e vincular o grupo de serviço correspondente.',
    targetRoles: ['Secretário'],
    sections: [
      {
        name: 'Tabela de Usuários Ativos',
        description:
          'Exibe nome, e-mail, função no sistema (Secretário, Responsável, Ancião) e o grupo de serviço atribuído.',
      },
      {
        name: 'Formulário de Criação e Edição',
        description:
          'Modal para cadastrar novo usuário com e-mail, senha de acesso, função e vínculo ao grupo.',
      },
    ],
    steps: [
      {
        title: 'Cadastrar um Novo Usuário',
        description:
          'Clique em "+ Novo Usuário", insira o nome completo do irmão, seu e-mail e crie uma senha temporária segura com ao menos 10 caracteres.',
      },
      {
        title: 'Definir a Função Correta',
        description:
          'Escolha "Responsável" para dirigentes de grupo (acesso ao seu grupo), "Ancião" para membros do corpo com consulta geral, ou "Secretário" para controle total.',
      },
      {
        title: 'Vincular ao Grupo Designado',
        description:
          'Se a função for Responsável, selecione o grupo de serviço de campo que o irmão dirige (ex: Grupo 2).',
      },
      {
        title: 'Editar ou Redefinir Senha',
        description:
          'Clique no ícone de lápis na linha do usuário para alterar nome, função ou cadastrar uma nova senha caso o irmão tenha esquecido.',
      },
    ],
    commonActions: [
      {
        action: 'Redefinir a senha de um dirigente de grupo',
        howTo:
          'Clique no ícone de lápis ao lado do nome do usuário, digite uma nova senha no campo "Senha" e clique em Salvar.',
      },
      {
        action: 'Trocar o dirigente responsável de um grupo',
        howTo:
          'Edite o usuário do dirigente anterior para alterar o grupo, ou edite o novo usuário e atribua o grupo desejado.',
      },
    ],
    tips: [
      'A senha de novos usuários deve conter no mínimo 10 caracteres por segurança.',
      'Oriente os irmãos a alterarem a senha temporária na página "Configurações" no primeiro acesso.',
    ],
  },

  '/settings': {
    id: 'settings',
    route: '/settings',
    title: 'Configurações de Conta',
    subtitle: 'Gerencie sua segurança pessoal e senha de acesso',
    iconName: 'SettingsIcon',
    purpose:
      'Permite que qualquer usuário logado (Secretário, Responsável ou Ancião) altere sua própria senha de acesso de forma segura.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Segurança da Conta',
        description: 'Formulário para alteração de senha exigindo a confirmação da senha atual.',
      },
    ],
    steps: [
      {
        title: 'Informe a Senha Atual',
        description: 'Digite a senha que você utilizou para entrar no sistema.',
      },
      {
        title: 'Digite a Nova Senha',
        description:
          'Crie uma nova senha com no mínimo 8 caracteres (recomendamos mesclar letras e números).',
      },
      {
        title: 'Confirme a Nova Senha e Salve',
        description: 'Repita a nova senha no campo de confirmação e clique em "Alterar Senha".',
      },
    ],
    commonActions: [
      {
        action: 'Como trocar minha senha de acesso',
        howTo:
          'Acesse "Configurações" no menu lateral, preencha os 3 campos de senha e clique em "Alterar Senha".',
      },
    ],
    tips: [
      'Nunca compartilhe sua senha de acesso com terceiros para manter o sigilo dos relatórios e do pastoreio dos irmãos.',
    ],
  },

  '/s10': {
    id: 's10',
    route: '/s10',
    title: 'Análise de Congregação (S-10)',
    subtitle: 'Relatório oficial do Ano de Serviço (setembro a agosto)',
    iconName: 'ClipboardList',
    purpose:
      'Consolida as informações do ano de serviço da congregação: médias anuais de assistência às reuniões (S-88), total de publicadores ativos (fotografia de agosto), contagem de situações especiais e cobertura dos cartões de território.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Página 1: Assistência e Publicadores',
        description:
          'Estrutura idêntica ao hub.jw.org: Médias de assistência, Totais da congregação (Publicadores ativos, Novos inativos, Publicadores reativados, Surdos, Cegos, Presos) e painel adicional de apoio para controle interno (Novos não batizados e Readmitidos).',
      },
      {
        name: 'Página 2: Cobertura de Cartões de Território',
        description:
          'Espelho oficial do hub.jw.org: "Número total de cartões de território" e "Cartões de território não trabalhados" (com nota de ajuda sobre campanhas especiais), além de indicadores internos de apoio.',
      },
      {
        name: 'Impressão e PDF no Padrão S-1',
        description:
          'Gera o documento impresso em formato oficial de 2 páginas com cabeçalho da congregação, tabelas estruturadas e campo para assinaturas.',
      },
    ],
    steps: [
      {
        title: 'Selecione o Ano de Serviço',
        description:
          'Escolha o ano de serviço desejado no topo da tela (ex.: Ano de Serviço de 2026 compreende set/2025 a ago/2026).',
      },
      {
        title: 'Confira os dados calculados na Página 1',
        description:
          'Verifique as médias de assistência do S-88, os publicadores ativos, novos inativos e publicadores reativados (todos calculados automaticamente com possibilidade de override manual).',
      },
      {
        title: 'Confira ou ajuste os campos e avance',
        description:
          'Ajuste se necessário os números de novos inativos e reativados, informe os dados de surdos, cegos e presos, e clique em "Próximo". As informações adicionais de apoio ficam fora da impressão oficial.',
      },
      {
        title: 'Lance os números de território na Página 2',
        description:
          'Informe o "Número total de cartões de território" e os "Cartões de território não trabalhados" (atenção à nota: territórios trabalhados em campanhas especiais são considerados trabalhados), e clique em "Enviar" ou "Salvar".',
      },
    ],
    commonActions: [
      {
        action: 'Imprimir o formulário oficial S-10',
        howTo:
          'Clique no botão "Imprimir / PDF" no topo da tela para abrir a pré-visualização de impressão com quebras de página automáticas.',
      },
      {
        action: 'Recarregar dados calculados',
        howTo:
          'Na Página 1, clique em "Recarregar Médias" para reprocessar a assistência e os ativos em tempo real.',
      },
    ],
    tips: [
      'A fotografia de agosto é tirada com base na regra consolidada de atividade dos últimos 6 meses.',
      'Diferença conceitual essencial: "Readmitidos" são ex-removidos reintegrados formalmente pelos anciãos; "Reativados" são inativos (6+ meses sem relatar) que retomaram os relatos. Uma mesma pessoa pode constar como inativo e reativado no mesmo ano.',
      'O perfil Ancião tem acesso para visualização e impressão dos dados arquivados da congregação.',
    ],
  },

  'central-avisos': {
    id: 'central-avisos',
    route: 'central-avisos',
    title: 'Central de Avisos e Notificações',
    subtitle: 'Alertas automáticos do sistema sobre prazos e pendências',
    iconName: 'Bell',
    purpose:
      'Painel de notificações localizado no sino do cabeçalho superior. Notifica automaticamente pendências críticas como grupos que ainda não fecharam o relatório do mês, visitas atrasadas e prazos do S-1.',
    targetRoles: ['Secretário', 'Responsável', 'Ancião'],
    sections: [
      {
        name: 'Contador de Alertas no Sino',
        description:
          'Exibe uma bolha vermelha com o número de pendências ativas aguardando resolução.',
      },
      {
        name: 'Itens de Alerta com Ação Imediata',
        description:
          'Cada aviso oferece botão de envio direto por WhatsApp, cópia por e-mail e botão "Resolver" para dar baixa.',
      },
      {
        name: 'Botão "Verificar Agora"',
        description:
          'Executa o motor de regras do sistema para recalcular pendências em tempo real.',
      },
    ],
    steps: [
      {
        title: 'Abra a Central de Avisos',
        description: 'Clique no ícone de sino no canto superior direito do cabeçalho.',
      },
      {
        title: 'Examine os Avisos Pendentes',
        description:
          'Leia o título e o nível de severidade (crítica, alta, moderada) de cada alerta exibido.',
      },
      {
        title: 'Tome Ação com 1 Clique',
        description:
          'Utilize o botão "WhatsApp" para contatar o responsável ou clique em "Resolver" após concluir a pendência.',
      },
    ],
    commonActions: [
      {
        action: 'Resolver um alerta que já foi tratado',
        howTo:
          'Abra o sino de notificações e clique no botão "Resolver" ao lado do aviso correspondente.',
      },
      {
        action: 'Forçar checagem imediata de pendências',
        howTo:
          'No menu do sino, clique no botão "Verificar Agora" ao lado do título da Central de Avisos.',
      },
    ],
    tips: ['A Central de Avisos é atualizada automaticamente a cada minuto em segundo plano.'],
  },
}

/**
 * Função utilitária para buscar o guia correspondente a uma rota
 */
export function getGuideForRoute(pathname: string): ModuleGuide | undefined {
  // Normalizar rota (remover parâmetros de consulta ou barras finais)
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/'

  // Casos específicos de rotas com subpastas
  if (cleanPath.startsWith('/publishers/')) {
    return MODULE_GUIDES['/publishers']
  }

  if (MODULE_GUIDES[cleanPath]) {
    return MODULE_GUIDES[cleanPath]
  }

  // Rota raiz vai para dashboard
  if (cleanPath === '/' || cleanPath === '') {
    return MODULE_GUIDES['/dashboard']
  }

  return undefined
}
