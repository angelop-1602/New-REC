"use client"

import * as React from "react"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { LoadingSkeleton } from "@/components/ui/loading"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols"
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore"
import { getStatusBadge } from "@/lib/utils/statusUtils"
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols, 
  sortProtocolsByDate,
  getProtocolTitle,
  getProtocolCode,
  getPIName,
  toDate
} from '@/types'

export function DataTable() {
  const router = useRouter();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true } // Sort by most recent first
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");

  // ⚡ Real-time data for all protocols
  const { protocols: pendingProtocols, loading: pendingLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'pending',
    enabled: true,
  });

  const { protocols: acceptedProtocols, loading: acceptedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'accepted',
    enabled: true,
  });

  const { protocols: approvedProtocols, loading: approvedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'approved',
    enabled: true,
  });

  const { protocols: archivedProtocols, loading: archivedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'archived',
    enabled: true,
  });

  const loading = pendingLoading || acceptedLoading || approvedLoading || archivedLoading;

  // Combine all protocols using new type system
  const protocols = useMemo(() => {
    const allProtocols = [
      ...pendingProtocols,
      ...acceptedProtocols,
      ...approvedProtocols,
      ...archivedProtocols,
    ];
    const typedProtocols = toChairpersonProtocols(allProtocols);
    return sortProtocolsByDate(typedProtocols);
  }, [pendingProtocols, acceptedProtocols, approvedProtocols, archivedProtocols]);

  const getProtocolStatusBadge = (protocol: ChairpersonProtocol) => {
    return getStatusBadge(
      protocol.status,
      protocol.decision || protocol.decisionDetails?.decision,
      protocol.hasReviewers || false
    );
  };

  const columns: ColumnDef<ChairpersonProtocol>[] = useMemo(() => [
    {
      accessorKey: "applicationID",
      header: "Application ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.applicationID || row.original.id}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Protocol Title",
      cell: ({ row }) => (
        <div className="max-w-[200px] sm:max-w-[300px] truncate font-medium">
          {getProtocolTitle(row.original)}
        </div>
      ),
    },
    {
      accessorKey: "tempProtocolCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {getProtocolCode(row.original) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submittedByName || getPIName(row.original) || "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => {
        try {
          const dateObj = toDate(row.original.createdAt);
          if (!dateObj) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(dateObj, { addSuffix: true })}
            </div>
          );
        } catch {
          return <span className="text-muted-foreground">—</span>;
        }
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getProtocolStatusBadge(row.original),
    },
  ], []);

  const table = useReactTable({
    data: protocols,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  if (loading) {
    return (
      <div className="w-full space-y-3 sm:space-y-4 min-w-0 px-4 lg:px-6">
        <div className="rounded-md border border-[#036635]/10 dark:border-[#FECC07]/20 overflow-hidden">
          {/* Header skeleton */}
          <div className="border-b border-[#036635]/10 dark:border-[#FECC07]/20 bg-[#036635]/5 dark:bg-[#FECC07]/10 px-4 py-3">
            <LoadingSkeleton className="h-4 w-40 rounded-md" />
          </div>
          {/* Rows skeleton */}
          <div className="divide-y divide-[#036635]/10 dark:divide-[#FECC07]/20">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4 px-4 py-3">
                <LoadingSkeleton className="h-4 w-28 rounded-md" />
                <LoadingSkeleton className="h-4 w-64 rounded-md hidden sm:block" />
                <LoadingSkeleton className="h-4 w-24 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 min-w-0">
      <div className="rounded-md border border-[#036635]/10 dark:border-[#FECC07]/20 overflow-x-auto transition-all duration-300 hover:shadow-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-[#036635] dark:text-[#FECC07] whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="transition-colors duration-200 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No protocols found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="text-muted-foreground text-xs sm:text-sm">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} protocol(s)
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-xs sm:text-sm font-medium whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

