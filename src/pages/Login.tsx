import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Eye, EyeOff, ShieldCheck, BookOpen, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError('Email ou senha incorretos. Por favor, verifique suas credenciais.')
      setIsSubmitting(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleForgotPassword = () => {
    toast.info('Recuperação de Senha', {
      description:
        'Por favor, contate o administrador do sistema ou o Secretário da congregação para redefinir sua senha.',
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-primary/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Relatórios da Congregação Macaúbas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[320px] mx-auto">
            Mantenha os registros da congregação organizados e atualizados em um só lugar.
          </p>
        </div>

        <Card className="w-full shadow-xl border-slate-200/60 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-lg font-semibold">Acesso ao Painel</CardTitle>
            <CardDescription className="text-sm flex flex-col gap-1.5 pt-1">
              <span>Acesse o painel para consultar e organizar os relatórios da congregação.</span>
              <span>Use suas credenciais para entrar com segurança.</span>
              <span className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium bg-amber-50 dark:bg-amber-500/10 py-1.5 px-3 rounded-md mx-auto inline-block">
                Acesso exclusivo para Secretários e Responsáveis de Grupo.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSubmitting ? (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="h-11 w-full mt-6" />
                <p className="text-center text-sm text-slate-500 animate-pulse pt-2">
                  Autenticando com segurança...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5"
                        >
                          <HelpCircle className="h-4 w-4" />
                          <span className="sr-only">Ajuda sobre email</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">
                          Use o email cadastrado pelo administrador do sistema.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-1"
                      onClick={handleForgotPassword}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 pr-10 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:text-primary"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium mt-2 shadow-sm transition-all hover:shadow-md"
                >
                  Entrar no Painel
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4 rounded-b-xl">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <span>Conexão segura e acesso oficial</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
