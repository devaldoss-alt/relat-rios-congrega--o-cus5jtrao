import { useEffect, useState, useMemo } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getPublisher, Publisher } from '@/services/publishers'
import { getPublisherReportsHistory, PublisherReport } from '@/services/publisher_reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, BookOpen, Calendar, User as UserIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function PublisherProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [reports, setReports] = useState<PublisherReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const pub = await getPublisher(id)
        setPublisher(pub)
        const reps = await getPublisherReportsHistory(id, 12)
        setReports(reps.items)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const isSecretario = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'
  const canView =
    isSecretario || (isResponsavel && publisher?.expand?.group_id?.number === user?.group_number)

  if (!loading && !publisher) {
    return <Navigate to="/dashboard" replace />
  }

  if (!loading && !canView) {
    return <Navigate to="/dashboard" replace />
  }

  const chartData = useMemo(() => {
    const data = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      let d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      let y = d.getFullYear()
      let m = d.getMonth() + 1
      let mStr = m < 10 ? `0${m}` : `${m}`
      const rep = reports.find((r) => r.year === y && r.month === mStr)
      data.push({
        name: `${mStr}/${y}`,
        Horas: rep?.hours || 0,
        Estudos: rep?.bible_studies || 0,
      })
    }
    return data
  }, [reports])

  const totalHours = reports.reduce((acc, r) => acc + (r.hours || 0), 0)
  const totalStudies = reports.reduce((acc, r) => acc + (r.bible_studies || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/publishers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Perfil do Publicador</h2>
          <p className="text-muted-foreground mt-1">Histórico e atividade anual</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : publisher ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{publisher.name}</CardTitle>
                  <CardDescription className="capitalize flex items-center gap-2 mt-1">
                    {publisher.type.replace('_', ' ')}
                    {publisher.active ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        Inativo
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-4 text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Grupo:</strong> {publisher.expand?.group_id?.number || '-'}
                </p>
                <p>
                  <strong>Telefone:</strong> {publisher.phone || 'Não informado'}
                </p>
                <p>
                  <strong>Endereço:</strong> {publisher.address || 'Não informado'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Horas (Últimos 12m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalHours}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Estudos (Últimos 12m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalStudies}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Anual</CardTitle>
              <CardDescription>
                Horas e Estudos Bíblicos ao longo dos últimos 12 meses
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  Horas: { label: 'Horas', color: 'hsl(var(--chart-1))' },
                  Estudos: { label: 'Estudos', color: 'hsl(var(--chart-2))' },
                }}
                className="h-full w-full"
              >
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Horas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Estudos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Lançamentos
              </CardTitle>
              <CardDescription>Lista detalhada de relatórios</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Estudos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum relatório encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.month}/{r.year}
                        </TableCell>
                        <TableCell>{r.hours || 0}</TableCell>
                        <TableCell>{r.bible_studies || 0}</TableCell>
                        <TableCell>
                          {r.participated ? (
                            <Badge
                              variant="outline"
                              className="text-emerald-600 bg-emerald-50 border-emerald-200"
                            >
                              Participou
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-red-600 bg-red-50 border-red-200"
                            >
                              Não Participou
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.notes || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
