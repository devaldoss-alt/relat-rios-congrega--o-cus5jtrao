import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
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
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Users,
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
  Bell,
  CheckSquare,
} from 'lucide-react'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { GuideDialog } from '@/components/GuideDialog'

const getNavigation = (role?: string) => {
  // Base compartilhada
  const items = [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]

  // Se for Ancião ou Secretário, adiciona Painel dos Anciãos, Atas e Notificações no topo
  if (role === 'Secretário' || role === 'Ancião') {
    items.push({ name: 'Painel dos Anciãos', href: '/elders-panel', icon: Shield })
    items.push({ name: 'Visitas de Pastoreio', href: '/visits', icon: CalendarCheck })
    items.push({ name: 'Atas e Ações', href: '/minutes', icon: CheckSquare })
  } else if (role === 'Responsável') {
    // Responsável também tem acesso a Visitas de Pastoreio conforme os requisitos
    items.push({ name: 'Visitas de Pastoreio', href: '/visits', icon: CalendarCheck })
  }

  // Entrada de Dados (apenas quem pode lançar: Secretário e Responsável)
  if (role === 'Secretário' || role === 'Responsável') {
    items.push({ name: 'Entrada de Dados', href: '/group-data', icon: Users })
  }

  // Assistência e relatórios de consulta
  items.push({ name: 'Assistência às Reuniões', href: '/attendance', icon: CalendarCheck })
  items.push({ name: 'Compilação de Relatório', href: '/reports', icon: FileText })
  items.push({ name: 'Métricas de Saúde', href: '/metrics', icon: Activity })

  // Acesso total do Ancião e do Secretário às telas analíticas
  if (role === 'Secretário' || role === 'Ancião') {
    items.push({ name: 'Gestão de Publicadores', href: '/publishers', icon: Users })
    items.push({ name: 'Histórico de Relatórios', href: '/reports-history', icon: BookOpen })
    items.push({
      name: 'Relatório Deliberativo',
      href: '/deliberative-report',
      icon: ClipboardList,
    })
  }

  // Módulo de Usuários (restrito a Secretário)
  if (role === 'Secretário') {
    items.push({ name: 'Usuários', href: '/users', icon: UserCog })
  }

  // Links padrão de apoio
  items.push({ name: 'Tutorial de Uso', href: '/tutorial', icon: HelpCircle })
  items.push({ name: 'Configurações', href: '/settings', icon: SettingsIcon })

  return items
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navigation = getNavigation(user?.role)

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider className="print:block">
      <Sidebar variant="inset" className="print:hidden">
        <SidebarHeader className="h-16 flex items-center justify-center px-4 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary w-full">
            <BookOpen className="h-6 w-6" />
            <span className="truncate">Relatórios</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.href}
                      tooltip={item.name}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t hidden md:block">
          <div className="text-xs text-muted-foreground text-center">Macaúbas - v0.0.1</div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="print:p-0 print:m-0 print:bg-transparent print:border-none">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 bg-background print:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 lg:hidden" />
            <h1 className="text-sm font-medium lg:hidden">Dashboard</h1>
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
