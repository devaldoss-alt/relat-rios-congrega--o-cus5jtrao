import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Lightbulb,
} from 'lucide-react'
import { getGuideForRoute, ModuleGuide } from '@/content/guides'

interface GuideDialogProps {
  /** Rota opcional para forçar um guia específico. Se omitido, usa a rota atual */
  route?: string
  /** Texto do botão (padrão: "Como usar") */
  label?: string
  /** Variante do botão shadcn (padrão: "outline") */
  variant?: 'outline' | 'ghost' | 'default' | 'secondary'
  /** Tamanho do botão (padrão: "sm") */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Classes CSS adicionais para o botão trigger */
  className?: string
  /** Se deve mostrar apenas o ícone sem o texto (para espaços compactos em telas móveis) */
  iconOnly?: boolean
}

export function GuideDialog({
  route,
  label = 'Como usar',
  variant = 'outline',
  size = 'sm',
  className = '',
  iconOnly = false,
}: GuideDialogProps) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const currentRoute = route || location.pathname
  const guide: ModuleGuide | undefined = getGuideForRoute(currentRoute)

  if (!guide) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:text-primary ${className}`}
          title={`Como usar a tela ${guide.title}`}
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
          {!iconOnly && <span>{label}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[88vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header do Guia */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <span>Guia: {guide.title}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {guide.subtitle}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Acesso:
            </span>
            {guide.targetRoles.map((role) => (
              <Badge key={role} variant="secondary" className="text-[10px] py-0 px-1.5">
                {role}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Conteúdo com rolagem */}
        <ScrollArea className="flex-1 p-5 overflow-y-auto max-h-[calc(88vh-130px)]">
          <div className="space-y-6 text-sm">
            {/* Para que serve esta tela */}
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-3.5 space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <Compass className="h-3.5 w-3.5" /> Para que serve esta tela?
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">{guide.purpose}</p>
            </div>

            {/* Passo a passo recomendado */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passo a Passo Recomendado
              </h4>
              <div className="space-y-3">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-xs text-foreground">{step.title}</p>
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

            <Separator />

            {/* O que fazer em cada seção da tela */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> O que fazer em cada seção
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {guide.sections.map((sec, idx) => (
                  <div key={idx} className="p-2.5 rounded-md border bg-muted/20 space-y-1">
                    <p className="font-medium text-xs text-foreground">{sec.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações Mais Comuns */}
            {guide.commonActions && guide.commonActions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary">
                    <ArrowRight className="h-3.5 w-3.5" /> Dúvidas e Ações Mais Frequentes
                  </h4>
                  <div className="space-y-2">
                    {guide.commonActions.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-md bg-muted/40 space-y-1">
                        <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
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
              </>
            )}

            {/* Dicas Pastorais */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border">
                <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Dicas Importantes
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
          </div>
        </ScrollArea>

        {/* Rodapé com link para Tutorial completo */}
        <div className="p-3 px-5 border-t bg-muted/20 flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground hidden sm:inline">
            Precisa de um passo a passo do fluxo completo?
          </span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-primary hover:text-primary ml-auto"
            onClick={() => setOpen(false)}
          >
            <Link to={`/tutorial#${guide.id}`} className="flex items-center gap-1">
              Ver no Tutorial Completo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
