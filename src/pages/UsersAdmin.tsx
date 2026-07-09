import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { getUsers, createUser, adminUpdateUser, deleteUser } from '@/services/users'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Plus, Loader2, UserCog } from 'lucide-react'
import { RecordModel } from 'pocketbase'

const GROUP_NAMES = ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4'] as const
const ROLES = ['Secretário', 'Responsável'] as const

const userSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: 'A senha deve ter pelo menos 10 caracteres.',
    }),
  role: z.enum(ROLES, {
    error: 'Função é obrigatória',
  }),
  group_name: z.enum(GROUP_NAMES, {
    error: 'Grupo é obrigatório',
  }),
})

type UserFormValues = z.infer<typeof userSchema>

export default function UsersAdmin() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isSecretario = user?.role === 'Secretário'

  const [usersList, setUsersList] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<RecordModel | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Responsável',
      group_name: 'Grupo 1',
    },
  })

  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      setUsersList(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSecretario) fetchUsers()
  }, [isSecretario])

  if (!isSecretario) {
    return <Navigate to="/dashboard" replace />
  }

  const resolveEnumValue = <T extends string>(
    value: unknown,
    allowed: readonly T[],
    fallback: T,
  ): T => (allowed.includes(value as T) ? (value as T) : fallback)

  const handleOpenDialog = (u?: RecordModel) => {
    setFieldErrors({})
    if (u) {
      setEditingUser(u)
      form.reset({
        name: u.name || '',
        email: u.email || '',
        password: '',
        role: resolveEnumValue(u.role, ROLES, 'Responsável'),
        group_name: resolveEnumValue(u.group_name, GROUP_NAMES, 'Grupo 1'),
      })
    } else {
      setEditingUser(null)
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'Responsável',
        group_name: 'Grupo 1',
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setFieldErrors({})
  }

  const onSubmit = async (values: UserFormValues) => {
    setSaving(true)
    setFieldErrors({})
    try {
      const groupNumber = parseInt(values.group_name.replace('Grupo ', ''), 10)
      if (editingUser) {
        const payload: Record<string, unknown> = {
          name: values.name,
          email: values.email,
          role: values.role,
          group_name: values.group_name,
          group_number: groupNumber,
          emailVisibility: true,
        }
        if (values.password) {
          payload.password = values.password
        }
        await adminUpdateUser(editingUser.id, payload)
        toast({ title: 'Usuário atualizado com sucesso' })
      } else {
        if (!values.password) {
          toast({ title: 'Senha obrigatória para novos usuários', variant: 'destructive' })
          setSaving(false)
          return
        }
        await createUser({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          group_name: values.group_name,
          group_number: groupNumber,
        })
        toast({ title: 'Usuário criado com sucesso' })
      }
      setIsDialogOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro ao salvar usuário',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      await deleteUser(id)
      toast({ title: 'Usuário excluído com sucesso' })
      fetchUsers()
    } catch (err) {
      toast({
        title: 'Erro ao excluir usuário',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const renderFieldError = (fieldName: string) =>
    fieldErrors[fieldName] ? (
      <p className="text-sm text-destructive">{fieldErrors[fieldName]}</p>
    ) : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h2>
          <p className="text-muted-foreground mt-1">
            Administre os acessos e permissões do sistema.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado no sistema.
                    </TableCell>
                  </TableRow>
                ) : (
                  usersList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          {u.name || 'Sem nome'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.email || (
                          <span className="text-muted-foreground italic text-xs">Oculto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'Secretário' ? 'default' : 'outline'}>
                          {u.role || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.group_name || (u.group_number ? `Grupo ${u.group_number}` : '—')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(u.id)}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                    {renderFieldError('name')}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    {renderFieldError('email')}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha {editingUser && '(deixe em branco para manter)'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                    {renderFieldError('password')}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Secretário">Secretário</SelectItem>
                          <SelectItem value="Responsável">Responsável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {renderFieldError('role')}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="group_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo Designado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GROUP_NAMES.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {renderFieldError('group_name')}
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => handleCloseDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
