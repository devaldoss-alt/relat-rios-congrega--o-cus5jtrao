import { useState, useMemo, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Search,
  Sparkles,
  CalendarCheck,
  Users,
  Shield,
  FileText,
  Activity,
  CheckSquare,
  Clock,
  Compass,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  LayoutDashboard,
  UserCog,
  Settings as SettingsIcon,
  Bell,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { GETTING_STARTED, MODULE_GUIDES, ModuleGuide } from '@/content/guides'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  CalendarCheck,
  CheckSquare,
  Activity,
  BookOpen,
  ClipboardList: FileText,
  UserCog,
  SettingsIcon,
  Bell,
}

export default function Tutorial() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')

  // Ao carregar ou mudar o hash da URL, rolar suavemente até a âncora
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '')
      const el = document.getElementById(elementId)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [location.hash])

  const guidesList = useMemo(() => {
    return Object.values(MODULE_GUIDES)
  }, [])

  // Filtro por busca e categoria
  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guidesList.filter((g) => {
      // Categoria por papel
      if (selectedCategory !== 'todos') {
        const matchesRole = g.targetRoles.some((r) =>
          r.toLowerCase().includes(selectedCategory.toLowerCase()),
        )
        if (!matchesRole) return false
      }

      if (!q) return true

      const inTitle = g.title.toLowerCase().includes(q)
      const inSubtitle = g.subtitle.toLowerCase().includes(q)
      const inPurpose = g.purpose.toLowerCase().includes(q)
      const inSteps = g.steps.some(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
      )
      const inActions = g.commonActions.some(
        (a) => a.action.toLowerCase().includes(q) || a.howTo.toLowerCase().includes(q),
      )
      const inTips = g.tips.some((t) => t.toLowerCase().includes(q))

      return inTitle || inSubtitle || inPurpose || inSteps || inActions || inTips
    })
  }, [guidesList, search, selectedCategory])

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto animate-fade-in-up">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Manual do Usuário & Tutoriais</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Central de Ajuda e Tutoriais
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Instruções completas, passo a passo e dicas práticas para utilizar cada recurso do
            sistema <strong>Relatórios Congregação</strong>, tanto para Secretários e Anciãos quanto
            para Dirigentes e Responsáveis de grupo.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por módulo, ação ou dúvida (ex: S-1, pastoreio, horas)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/80 backdrop-blur-sm"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              Limpar busca
            </Button>
          )}
        </div>
      </div>

      {/* Grid Principal com Menu Lateral Interno de Âncoras e Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Menu Lateral Interno (Navegação Rápida por Âncoras) */}
        <aside className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" />
                Navegação Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-xs space-y-1">
              <a
                href="#primeiros-passos"
                className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors font-medium text-foreground"
              >
                <span>1. Primeiros Passos</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
              <a
                href="#fluxo-mensal"
                className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground hover:text-foreground"
              >
                <span>2. O Fluxo Mensal</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
              <a
                href="#perfis-acesso"
                className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground hover:text-foreground"
              >
                <span>3. Perfis e Funções</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>

              <Separator className="my-2" />

              <div className="px-2 py-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                Módulos do Sistema
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-0.5 pr-1">
                {guidesList.map((g) => (
                  <a
                    key={g.id}
                    href={`#${g.id}`}
                    className="flex items-center justify-between p-1.5 px-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="truncate">{g.title}</span>
                    <span className="text-[10px] text-muted-foreground/60">#</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dica Pastoral */}
          <div className="p-4 rounded-xl border bg-muted/40 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Lightbulb className="h-4 w-4" /> Dica Pastoral
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Você também pode clicar no botão <strong>"Como usar"</strong> presente no topo de cada
              página do sistema para abrir um diálogo com o guia rápido daquela tela.
            </p>
          </div>
        </aside>

        {/* Área de Conteúdo */}
        <div className="lg:col-span-3 space-y-10">
          {/* Seção 1: Primeiros Passos & Visão Geral */}
          {!search && (
            <section id="primeiros-passos" className="scroll-mt-20 space-y-6">
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Compass className="h-4 w-4" /> Seção 1
                </div>
                <h2 className="text-2xl font-bold tracking-tight mt-1">{GETTING_STARTED.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{GETTING_STARTED.subtitle}</p>
              </div>

              <Card className="bg-gradient-to-br from-card to-muted/30 border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {GETTING_STARTED.overview}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <div className="p-3.5 rounded-lg border bg-background/60 space-y-1">
                      <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Coleta sem
                        complicação
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chega de fichas de papel perdidas: os dirigentes lançam em minutos direto do
                        celular ou computador.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border bg-background/60 space-y-1">
                      <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> S-1 com 1 clique
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cálculos automáticos de publicadores ativos, pioneiros e assistência, com
                        texto pronto para colar em Betel.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Perfis de Acesso */}
              <div id="perfis-acesso" className="scroll-mt-20 space-y-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Perfis de Acesso no Sistema
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {GETTING_STARTED.roles.map((r) => (
                    <Card key={r.role} className="flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <Badge variant="outline" className="w-fit text-[10px] mb-1">
                          {r.badge}
                        </Badge>
                        <CardTitle className="text-base">{r.role}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between text-xs">
                        <p className="text-muted-foreground leading-relaxed">{r.description}</p>
                        <div className="pt-2 border-t space-y-1">
                          <p className="font-semibold text-foreground text-[11px]">
                            Principais tarefas:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                            {r.mainDuties.map((duty, idx) => (
                              <li key={idx} className="leading-snug">
                                {duty}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* O Fluxo Mensal */}
              <div id="fluxo-mensal" className="scroll-mt-20 space-y-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />O Fluxo Mensal dos Relatórios (Passo a
                  Passo)
                </h3>
                <div className="grid gap-4">
                  {GETTING_STARTED.monthlyCycle.map((cycle) => (
                    <div
                      key={cycle.step}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-card items-start"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold text-base flex items-center justify-center shrink-0">
                        {cycle.step}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-foreground">
                            {cycle.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[11px]">
                              {cycle.deadline}
                            </Badge>
                            <Badge variant="outline" className="text-[11px]">
                              {cycle.responsible}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                          {cycle.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regras de Ouro */}
              <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Regras Importantes do Processo
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  {GETTING_STARTED.goldenRules.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Seção 2: Módulos do Sistema */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <FileText className="h-4 w-4" /> Seção 2
                </div>
                <h2 className="text-2xl font-bold tracking-tight mt-1">
                  Guias por Módulo do Sistema
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Selecione ou busque o módulo que você deseja aprender a utilizar.
                </p>
              </div>

              {/* Filtro por Papel */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border w-fit">
                <Button
                  variant={selectedCategory === 'todos' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={selectedCategory === 'secretário' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory('secretário')}
                >
                  Secretário
                </Button>
                <Button
                  variant={selectedCategory === 'responsável' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory('responsável')}
                >
                  Responsável
                </Button>
                <Button
                  variant={selectedCategory === 'ancião' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory('ancião')}
                >
                  Ancião
                </Button>
              </div>
            </div>

            {/* Listagem de Cards de Módulo */}
            {filteredGuides.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/10 space-y-3">
                <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <p className="text-base font-semibold text-foreground">
                  Nenhum guia encontrado para "{search}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Tente buscar por outro termo ou limpe os filtros de categoria.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setSelectedCategory('todos')
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredGuides.map((guide) => {
                  const IconComponent = ICON_MAP[guide.iconName] || BookOpen

                  return (
                    <Card
                      key={guide.id}
                      id={guide.id}
                      className="scroll-mt-20 overflow-hidden shadow-sm border transition-shadow hover:shadow-md"
                    >
                      {/* Header do Card */}
                      <CardHeader className="bg-muted/30 border-b p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-xl flex items-center gap-2">
                                <span>{guide.title}</span>
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {guide.subtitle}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {guide.route !== 'central-avisos' && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-xs gap-1"
                              >
                                <Link to={guide.route}>
                                  Acessar Tela <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Perfis autorizados */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-3">
                          <span className="text-[11px] text-muted-foreground mr-1">
                            Disponível para:
                          </span>
                          {guide.targetRoles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-[10px]">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-6 text-sm">
                        {/* Para que serve */}
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5" /> Para que serve este módulo?
                          </h4>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {guide.purpose}
                          </p>
                        </div>

                        {/* Passo a Passo */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Passo a Passo de Utilização
                          </h4>
                          <div className="space-y-3">
                            {guide.steps.map((step, idx) => (
                              <div key={idx} className="flex gap-3 items-start">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <p className="font-semibold text-xs text-foreground">
                                    {step.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {step.description}
                                  </p>
                                  {step.tip && (
                                    <div className="text-[11px] bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-2 rounded border border-amber-200 dark:border-amber-800 flex items-start gap-1.5 mt-1">
                                      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                                      <span>{step.tip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Seções da tela */}
                        <div className="space-y-3 pt-2">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> O que fazer em cada seção da tela
                          </h4>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {guide.sections.map((sec, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border bg-muted/20 space-y-1"
                              >
                                <p className="font-semibold text-xs text-foreground">{sec.name}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {sec.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ações mais comuns */}
                        {guide.commonActions && guide.commonActions.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <ArrowRight className="h-3.5 w-3.5" /> Ações e Dúvidas Frequentes
                            </h4>
                            <div className="space-y-2">
                              {guide.commonActions.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg bg-muted/40 space-y-1 border"
                                >
                                  <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    {item.action}
                                  </p>
                                  <p className="text-xs text-muted-foreground pl-3 leading-relaxed">
                                    {item.howTo}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dicas */}
                        {guide.tips && guide.tips.length > 0 && (
                          <div className="bg-primary/5 rounded-lg p-3.5 space-y-1.5 border border-primary/10">
                            <p className="font-semibold text-xs text-foreground flex items-center gap-1.5 text-primary">
                              <Lightbulb className="h-3.5 w-3.5" /> Dicas Práticas
                            </p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                              {guide.tips.map((tip, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
