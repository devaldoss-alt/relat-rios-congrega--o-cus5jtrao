import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader2, BarChart3, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceChartProps {
  data: any[]
  loading: boolean
}

const chartConfig = {
  inPerson: { label: 'Presencial', color: 'hsl(var(--chart-1))' },
  zoom: { label: 'Zoom', color: 'hsl(var(--chart-2))' },
}

export function AttendanceChart({ data, loading }: AttendanceChartProps) {
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [meetingType, setMeetingType] = useState<'domingo' | 'quinta'>('domingo')
  const [showInPerson, setShowInPerson] = useState(true)
  const [showZoom, setShowZoom] = useState(true)

  const availableYears = useMemo(() => {
    const years = new Set(data.map((d) => new Date(d.meeting_date).getFullYear().toString()))
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [data, currentYear])

  const chartData = useMemo(() => {
    const filtered = data.filter((d) => {
      const date = new Date(d.meeting_date)
      return date.getFullYear().toString() === selectedYear && d.meeting_type === meetingType
    })

    const stats = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1)
      const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        inPersonSum: 0,
        zoomSum: 0,
        count: 0,
      }
    })

    filtered.forEach((d) => {
      const month = new Date(d.meeting_date).getMonth()
      stats[month].inPersonSum += d.in_person
      stats[month].zoomSum += d.zoom
      stats[month].count += 1
    })

    return stats.map((stat) => ({
      month: stat.month,
      inPerson: stat.count > 0 ? Math.round(stat.inPersonSum / stat.count) : 0,
      zoom: stat.count > 0 ? Math.round(stat.zoomSum / stat.count) : 0,
      total: stat.count > 0 ? Math.round((stat.inPersonSum + stat.zoomSum) / stat.count) : 0,
    }))
  }, [data, selectedYear, meetingType])

  const hasChartData = chartData.some((d) => d.total > 0)

  const renderTooltip = useCallback(
    ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const d = payload[0].payload
        const inVal = d.inPerson || 0
        const zoomVal = d.zoom || 0
        return (
          <div className="bg-background border rounded-lg shadow-sm p-3 text-sm min-w-[150px]">
            <p className="font-semibold mb-2">{label}</p>
            <div className="space-y-1.5">
              {showInPerson && (
                <div className="flex justify-between items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--chart-1))]" />
                    Presencial
                  </span>
                  <span className="font-medium text-foreground">{inVal}</span>
                </div>
              )}
              {showZoom && (
                <div className="flex justify-between items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--chart-2))]" />
                    Zoom
                  </span>
                  <span className="font-medium text-foreground">{zoomVal}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between gap-4 font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>{(showInPerson ? inVal : 0) + (showZoom ? zoomVal : 0)}</span>
            </div>
          </div>
        )
      }
      return null
    },
    [showInPerson, showZoom],
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Média de Assistência Mensal
          </CardTitle>
          <CardDescription>
            Acompanhe a média de presença nas reuniões ao longo do ano.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Tabs
            value={meetingType}
            onValueChange={(v) => setMeetingType(v as 'domingo' | 'quinta')}
            className="w-full sm:w-[260px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="domingo">Fim de Semana</TabsTrigger>
              <TabsTrigger value="quinta">Meio de Semana</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasChartData ? (
          <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg bg-muted/10">
            <Users className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">
              Sem dados para o período selecionado
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                {showInPerson && (
                  <Bar
                    dataKey="inPerson"
                    stackId="a"
                    fill="var(--color-inPerson)"
                    radius={showZoom ? [0, 0, 4, 4] : [4, 4, 4, 4]}
                    maxBarSize={40}
                  />
                )}
                {showZoom && (
                  <Bar
                    dataKey="zoom"
                    stackId="a"
                    fill="var(--color-zoom)"
                    radius={showInPerson ? [4, 4, 0, 0] : [4, 4, 4, 4]}
                    maxBarSize={40}
                  />
                )}
              </BarChart>
            </ChartContainer>

            <div className="flex justify-center items-center gap-6 mt-4">
              <button
                onClick={() => setShowInPerson(!showInPerson)}
                className={cn(
                  'flex items-center gap-2 text-sm transition-opacity hover:opacity-80 focus:outline-none',
                  !showInPerson && 'opacity-40 grayscale',
                )}
              >
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="font-medium">Presencial</span>
              </button>
              <button
                onClick={() => setShowZoom(!showZoom)}
                className={cn(
                  'flex items-center gap-2 text-sm transition-opacity hover:opacity-80 focus:outline-none',
                  !showZoom && 'opacity-40 grayscale',
                )}
              >
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="font-medium">Zoom</span>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
