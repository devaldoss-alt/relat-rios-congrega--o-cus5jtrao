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
} from 'lucide-react'

const getNavigation = (role?: string) => {
  const base = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Entrada de Dados', href: '/group-data', icon: Users },
    { name: 'Assistência às Reuniões', href: '/attendance', icon: CalendarCheck },
    { name: 'Compilação de Relatório', href: '/reports', icon: FileText },
    { name: 'Métricas de Saúde', href: '/metrics', icon: Activity },
    { name: 'Tutorial de Uso', href: '/tutorial', icon: HelpCircle },
    { name: 'Configurações', href: '/settings', icon: SettingsIcon },
  ]
  if (role === 'Secretário') {
    base.push({ name: 'Gestão de Publicadores', href: '/publishers', icon: Users })
    base.push({ name: 'Histórico de Relatórios', href: '/reports-history', icon: BookOpen })
    base.push({ name: 'Relatório Deliberativo', href: '/deliberative-report', icon: ClipboardList })
    base.push({ name: 'Usuários', href: '/users', icon: UserCog })
  }
  return base
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
    <SidebarProvider>
      <Sidebar variant="inset">
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

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 lg:hidden" />
            <h1 className="text-sm font-medium lg:hidden">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4 ml-auto">
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
        <main className="flex-1 overflow-auto bg-muted/20 p-4 lg:p-6 animate-in fade-in duration-500">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
