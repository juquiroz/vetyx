import { Skeleton } from "@/components/ui/skeleton"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  cargando?: boolean
  filasEsqueleto?: number
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  cargando = false,
  filasEsqueleto = 5,
  onRowClick,
}: DataTableProps<T>) {
  if (cargando) {
    return (
      <div className="space-y-2">
        <div className="flex gap-4 py-2">
          {columns.map((col) => (
            <Skeleton key={String(col.key)} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: filasEsqueleto }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <caption className="sr-only">Lista de registros</caption>
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={String(col.key)} className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="p-2 align-middle">
                  {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
