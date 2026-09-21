import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Users,
  FolderTree,
  CalendarCheck,
  FileText,
  Activity,
  LogOut,
  BookOpen,
  LayoutDashboard,
  UserCog,
  ClipboardList,
  HelpCircle,
  Settings as SettingsIcon,
  Shield,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { GuideDialog } from '@/components/GuideDialog'

export type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export type NavSection = {
  title: string
  items: NavItem[]
}

const getNavigationSections = (role?: string): NavSection[] => {
  const sections: NavSection[] = []

  // 1. Início
  sections.push({
    title: 'Início',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  })

  // 2. Congregação
  const congregacaoItems: NavItem[] = []
  // Publicadores (Secretário ou Ancião)
  if (role === 'Secretário' || role === 'Ancião') {
    congregacaoItems.push({
      name: 'Publicadores',
      href: '/publishers',
      icon: Users,
    })
  }
  // Grupos / Entrada de Dados (Secretário, Responsável ou Ancião)
  if (role === 'Secretário' || role === 'Responsável' || role === 'Ancião') {
    congregacaoItems.push({
      name: 'Grupos',
      href: '/group-data',
      icon: FolderTree,
    })
  }
  if (congregacaoItems.length > 0) {
    sections.push({
      title: 'Congregação',
      items: congregacaoItems,
    })
  }

  // 3. Relatórios
  const relatoriosItems: NavItem[] = []
  // Histórico de Relatórios (Secretário ou Ancião)
  if (role === 'Secretário' || role === 'Ancião') {
    relatoriosItems.push({
      name: 'Relatórios Mensais',
      href: '/reports-history',
      icon: BookOpen,
    })
  }
  // Relatório de Congregação (S-1)
  relatoriosItems.push({
    name: 'Relatório de Congregação (S-1)',
    href: '/reports',
    icon: FileText,
  })
  // Análise de Congregação (S-10)
  if (role === 'Secretário' || role === 'Responsável' || role === 'Ancião') {
    relatoriosItems.push({
      name: 'Análise de Congregação (S-10)',
      href: '/s10',
      icon: ClipboardList,
    })
  }
  // Assistência às Reuniões (disponível para todos)
  relatoriosItems.push({
    name: 'Assistência às Reuniões',
    href: '/attendance',
    icon: CalendarCheck,
  })
  // Métricas de Saúde (disponível para todos)
  relatoriosItems.push({
    name: 'Métricas de Saúde',
    href: '/metrics',
    icon: Activity,
  })
  // Relatório Deliberativo (Secretário ou Ancião)
  if (role === 'Secretário' || role === 'Ancião') {
    relatoriosItems.push({
      name: 'Relatório Deliberativo',
      href: '/deliberative-report',
      icon: ClipboardList,
    })
  }
  if (relatoriosItems.length > 0) {
    sections.push({
      title: 'Relatórios',
      items: relatoriosItems,
    })
  }

  // 4. Corpo de Anciãos
  const anciaosItems: NavItem[] = []
  if (role === 'Secretário' || role === 'Ancião') {
    anciaosItems.push({
      name: 'Painel dos Anciãos',
      href: '/elders-panel',
      icon: Shield,
    })
  }
  // Visitas de Pastoreio (Secretário, Ancião e Responsável)
  if (role === 'Secretário' || role === 'Ancião' || role === 'Responsável') {
    anciaosItems.push({
      name: 'Visitas de Pastoreio',
      href: '/visits',
      icon: CalendarCheck,
    })
  }
  // Atas e Decisões / Ações (Secretário ou Ancião)
  if (role === 'Secretário' || role === 'Ancião') {
    anciaosItems.push({
      name: 'Atas e Decisões',
      href: '/minutes',
      icon: CheckSquare,
    })
  }
  if (anciaosItems.length > 0) {
    sections.push({
      title: 'Corpo de Anciãos',
      items: anciaosItems,
    })
  }

  // 5. Ajuda e Configurações
  const ajudaItems: NavItem[] = [
    {
      name: 'Tutorial',
      href: '/tutorial',
      icon: HelpCircle,
    },
  ]
  if (role === 'Secretário') {
    ajudaItems.push({
      name: 'Usuários',
      href: '/users',
      icon: UserCog,
    })
  }
  ajudaItems.push({
    name: 'Configurações',
    href: '/settings',
    icon: SettingsIcon,
  })
  sections.push({
    title: 'Ajuda e Configurações',
    items: ajudaItems,
  })

  return sections
}

function SidebarCollapseToggleButton() {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className={cn(
        'w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200',
        isCollapsed ? 'justify-center px-0 h-8' : 'justify-start px-2 h-8',
      )}
      title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
      aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4 shrink-0" />
      ) : (
        <>
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Recolher menu</span>
        </>
      )}
    </Button>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navigationSections = getNavigationSections(user?.role)

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider defaultOpen={true} className="print:block">
      <Sidebar variant="inset" collapsible="icon" className="print:hidden">
        <SidebarHeader className="h-16 flex items-center justify-between px-3 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary overflow-hidden min-w-0">
            <BookOpen className="h-6 w-6 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Relatórios</span>
          </div>
          <div className="hidden md:flex items-center group-data-[collapsible=icon]:hidden">
            <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          {navigationSections.map((section, idx) => (
            <div key={section.title} className="w-full">
              {idx > 0 && <SidebarSeparator className="my-1 group-data-[collapsible=icon]:my-2" />}
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase px-2">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            location.pathname === item.href ||
                            (item.href === '/publishers' &&
                              location.pathname.startsWith('/publishers/'))
                          }
                          tooltip={item.name}
                        >
                          <Link to={item.href}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-2 border-t flex flex-col gap-2">
          <div className="hidden md:block">
            <SidebarCollapseToggleButton />
          </div>
          <div className="text-[11px] text-muted-foreground text-center truncate group-data-[collapsible=icon]:hidden">
            Macaúbas - v0.0.1
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="print:p-0 print:m-0 print:bg-transparent print:border-none">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 bg-background print:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2" />
            <h1 className="text-sm font-medium lg:hidden">Relatórios Congregação</h1>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <GuideDialog />
            <NotificationBadge />
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium leading-none">
                Bem-vindo, {user?.name || user?.email}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {user?.role
                  ? `${user.role}${user.group_number ? ` - Grupo ${user.group_number}` : ''}`
                  : 'Sessão Ativa'}
              </span>
            </div>
            <div className="h-8 w-px bg-border mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Sair</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20 p-4 lg:p-6 animate-in fade-in duration-500 print:p-0 print:m-0 print:overflow-visible print:bg-transparent">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
