import { useEffect, useState, useMemo } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getPublisher, Publisher } from '@/services/publishers'
import { getPublisherReportsByServiceYear, PublisherReport } from '@/services/publisher_reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
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
import { PrintableS21T } from '@/components/publishers/PrintableS21T'
import { PublisherEditDialog } from '@/components/publishers/PublisherEditDialog'
import pb from '@/lib/pocketbase/client'

const SERVICE_MONTHS = [
  { month: '09', name: 'Setembro' },
  { month: '10', name: 'Outubro' },
  { month: '11', name: 'Novembro' },
  { month: '12', name: 'Dezembro' },
  { month: '01', name: 'Janeiro' },
  { month: '02', name: 'Fevereiro' },
  { month: '03', name: 'Março' },
  { month: '04', name: 'Abril' },
  { month: '05', name: 'Maio' },
  { month: '06', name: 'Junho' },
  { month: '07', name: 'Julho' },
  { month: '08', name: 'Agosto' },
]

function getCurrentServiceYear() {
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

export default function PublisherProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [reports, setReports] = useState<PublisherReport[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceYear, setServiceYear] = useState(getCurrentServiceYear())
  const [editOpen, setEditOpen] = useState(false)
  const [group, setGroup] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const pub = await getPublisher(id)
        setPublisher(pub)
        if (pub.group_id) {
          const g = await pb.collection('groups').getOne(pub.group_id)
          setGroup(g)
        }
        const reps = await getPublisherReportsByServiceYear(id, serviceYear)
        setReports(reps)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, serviceYear])

  const isSecretario = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'
  const canView =
    isSecretario || (isResponsavel && publisher?.expand?.group_id?.number === user?.group_number)

  const isRegularPioneer = publisher?.type === 'pioneiro_regular'
  const pioneerGoal = group?.regular_pioneer_hour_goal || 0

  const chartData = useMemo(() => {
    return SERVICE_MONTHS.map(({ month, name }) => {
      const y = month >= '09' ? serviceYear - 1 : serviceYear
      const rep = reports.find((r) => r.month === month && r.year === y)
      return {
        name,
        Horas: rep?.hours || 0,
        Estudos: rep?.bible_studies || 0,
        Participou: rep?.participated || (rep?.hours && rep.hours > 0) ? 100 : 0,
        Meta: isRegularPioneer ? pioneerGoal : undefined,
      }
    })
  }, [reports, serviceYear, isRegularPioneer, pioneerGoal])

  let totalHours = 0
  let totalStudies = 0
  reports.forEach((r) => {
    totalHours += r.hours || 0
    totalStudies += r.bible_studies || 0
  })

  if (!loading && !publisher) return <Navigate to="/dashboard" replace />
  if (!loading && !canView) return <Navigate to="/dashboard" replace />

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in-up print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/publishers">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">REGISTRO DE PUBLICADOR</h2>
              <p className="text-muted-foreground mt-1">S-21-T 11/23</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Editar Dados
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir S-21-T
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : publisher ? (
          <>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{publisher.name}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {publisher.type.replace('_', ' ')}
                  </Badge>
                  {publisher.gender && <Badge variant="outline">{publisher.gender}</Badge>}
                  {publisher.hope && <Badge variant="outline">{publisher.hope}</Badge>}
                  {publisher.is_elder && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Ancião
                    </Badge>
                  )}
                  {publisher.is_ministerial_servant && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Servo ministerial
                    </Badge>
                  )}
                  {publisher.is_special_pioneer && (
                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                      Pioneiro especial
                    </Badge>
                  )}
                  {publisher.is_field_missionary && (
                    <Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
                      Missionário em campo
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
              <Button variant="ghost" size="icon" onClick={() => setServiceYear((y) => y - 1)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="font-semibold text-lg">Ano de Serviço {serviceYear}</h3>
              <Button variant="ghost" size="icon" onClick={() => setServiceYear((y) => y + 1)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividade</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-center">Participou no ministério</TableHead>
                      <TableHead className="text-center">Estudos bíblicos</TableHead>
                      <TableHead className="text-center">Pioneiro auxiliar</TableHead>
                      <TableHead className="text-center">Horas</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SERVICE_MONTHS.map(({ month, name }) => {
                      const y = month >= '09' ? serviceYear - 1 : serviceYear
                      const rep = reports.find((r) => r.month === month && r.year === y)
                      const participated = rep?.participated || (rep?.hours && rep.hours > 0)
                      const isAux = rep?.type === 'pioneiro_auxiliar'
                      return (
                        <TableRow key={month}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-center">
                            {participated ? <CheckBadge /> : null}
                          </TableCell>
                          <TableCell className="text-center">{rep?.bible_studies || '-'}</TableCell>
                          <TableCell className="text-center">
                            {isAux ? <CheckBadge /> : null}
                          </TableCell>
                          <TableCell className="text-center">{rep?.hours || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {rep?.notes || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold text-right" colSpan={2}>
                        Total
                      </TableHead>
                      <TableHead className="font-bold text-center text-foreground">
                        {totalStudies}
                      </TableHead>
                      <TableHead></TableHead>
                      <TableHead className="font-bold text-center text-foreground">
                        {totalHours}
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Anual (Ano de Serviço {serviceYear})</CardTitle>
                <CardDescription>
                  Horas e Estudos Bíblicos ao longo do ano de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ChartContainer
                  config={{
                    Horas: { label: 'Horas', color: 'hsl(var(--chart-1))' },
                    Estudos: { label: 'Estudos', color: 'hsl(var(--chart-2))' },
                    Meta: { label: 'Meta de Horas', color: 'hsl(var(--primary))' },
                  }}
                  className="h-full w-full"
                >
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Horas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Estudos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    {isRegularPioneer && pioneerGoal > 0 && (
                      <Line
                        type="monotone"
                        dataKey="Meta"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {publisher && (
        <PrintableS21T publisher={publisher} reports={reports} serviceYear={serviceYear} />
      )}

      <PublisherEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        publisher={publisher}
        onSaved={setPublisher}
      />
    </>
  )
}

function CheckBadge() {
  return (
    <div className="mx-auto w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  )
}
