import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface AttendanceRecord {
  id: string
  meeting_date: string
  meeting_type: string
  in_person: number
  zoom: number
}

interface AttendanceTableProps {
  data: AttendanceRecord[]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function AttendanceTable({ data }: AttendanceTableProps) {
  if (data.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border mt-2 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold">Reunião</TableHead>
            <TableHead className="text-right font-semibold">Presenciais</TableHead>
            <TableHead className="text-right font-semibold">Zoom</TableHead>
            <TableHead className="text-right font-bold text-primary">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => {
            const total = record.in_person + record.zoom
            const label =
              record.meeting_type === 'domingo'
                ? 'Reunião de Fim de Semana'
                : 'Reunião Vida e Ministério'
            return (
              <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{formatDate(record.meeting_date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={record.meeting_type === 'domingo' ? 'default' : 'secondary'}
                    className="font-medium"
                  >
                    {label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {record.in_person}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{record.zoom}</TableCell>
                <TableCell className="text-right font-bold text-primary">{total}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
