import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Shield, KeyRound, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Settings() {
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      toast.error('A senha atual é obrigatória.')
      return
    }

    if (password !== passwordConfirm) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }

    if (password.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      if (user) {
        await pb.collection('users').update(user.id, {
          oldPassword,
          password,
          passwordConfirm,
        })
        toast.success('Senha atualizada com sucesso.')
        setOldPassword('')
        setPassword('')
        setPasswordConfirm('')
      }
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ||
          'Erro ao atualizar a senha. Verifique se a senha atual está correta.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências e segurança da conta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso ao sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Senha Atual</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Sua senha atual"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Digite a nova senha novamente"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto mt-4">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Alterar Senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
