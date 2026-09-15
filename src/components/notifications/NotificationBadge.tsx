import React, { useState, useEffect } from 'react'
import { Bell, Check, Loader2, MessageCircle, Mail, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  getPendingAlerts,
  resolveAlert,
  triggerAlertsEngine,
  sendElderNotificationEmail,
  buildWhatsAppLink,
  SystemAlert,
} from '@/services/alerts'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { GuideDialog } from '@/components/GuideDialog'

export function NotificationBadge() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadAlerts = async () => {
    try {
      const pending = await getPendingAlerts()
      setAlerts(pending)
    } catch (err) {
      console.error('Falha ao carregar alertas:', err)
    }
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 60000) // atualiza a cada 1 min
    return () => clearInterval(interval)
  }, [])

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await resolveAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Alerta resolvido com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao resolver alerta', variant: 'destructive' })
    }
  }

  const handleRunEngine = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRefreshing(true)
    try {
      await triggerAlertsEngine()
      await loadAlerts()
      toast({ title: 'Motor de alertas executado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao executar motor', variant: 'destructive' })
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendEmail = async (alert: SystemAlert, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.email) {
      return toast({ title: 'E-mail do usuário não identificado', variant: 'destructive' })
    }
    try {
      const res = await sendElderNotificationEmail({
        email: user.email,
        subject: `[Aviso Congregação] ${alert.title}`,
        message: `
          <h3>${alert.title}</h3>
          <p>${alert.description || 'Alerta pendente no sistema de Relatórios da Congregação.'}</p>
          <p><strong>Severidade:</strong> ${alert.severity}</p>
          <p>Acesse o sistema para verificar os detalhes.</p>
        `,
      })
      if (res.success) {
        toast({ title: 'E-mail enviado para o seu endereço!' })
      } else {
        toast({ title: 'Não foi possível disparar o e-mail', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Erro no envio de e-mail', variant: 'destructive' })
    }
  }

  const pendingCount = alerts.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[85vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Central de Avisos</span>
            <Badge variant="outline" className="ml-1 text-xs font-mono">
              {pendingCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-primary"
            onClick={handleRunEngine}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Verificar Agora
          </Button>
          <GuideDialog
            route="central-avisos"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            label="Guia"
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
            Nenhuma pendência ou alerta ativo no momento. Tudo em dia!
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {alerts.slice(0, 10).map((alert) => {
              const waText = `*Aviso do Sistema - Relatórios Congregação*\n\n📌 *${alert.title}*\n${alert.description || ''}`
              const waLink = buildWhatsAppLink(alert.expand?.responsible_user?.phone, waText)

              return (
                <div
                  key={alert.id}
                  className="p-3 text-xs space-y-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-foreground line-clamp-2">
                      {alert.title}
                    </span>
                    <Badge
                      variant={
                        alert.severity === 'critica'
                          ? 'destructive'
                          : alert.severity === 'alta'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="text-[10px] uppercase shrink-0"
                    >
                      {alert.severity}
                    </Badge>
                  </div>

                  {alert.description && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp com 1 clique */}
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-[11px]"
                        title="Enviar pelo WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>

                      {/* Notificação por E-mail */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                        onClick={(e) => handleSendEmail(alert, e)}
                        title="Enviar cópia por e-mail"
                      >
                        <Mail className="h-3 w-3" /> E-mail
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-emerald-600 gap-1"
                      onClick={(e) => handleResolve(alert.id, e)}
                    >
                      <Check className="h-3 w-3" /> Resolver
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {alerts.length > 10 && (
          <div className="p-2 text-center border-t">
            <span className="text-xs text-muted-foreground">
              + {alerts.length - 10} outros avisos ativos
            </span>
          </div>
        )}

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="outline" size="sm" asChild className="w-full text-xs h-8">
            <Link to="/elders-panel">Abrir Painel dos Anciãos</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
