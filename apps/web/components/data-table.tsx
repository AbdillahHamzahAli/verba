"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

/**
 * DataTable — renders query results in a styled table.
 * Dynamically creates columns from the data.
 */
export function DataTable({ columns, rows }: DataTableProps) {
  if (columns.length === 0 || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No results returned.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/20">
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    className="text-sm whitespace-nowrap max-w-[300px] truncate"
                  >
                    {row[col] === null ? (
                      <span className="text-muted-foreground italic">NULL</span>
                    ) : typeof row[col] === "object" ? (
                      JSON.stringify(row[col])
                    ) : (
                      String(row[col])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-3 py-2 border-t border-border/40 bg-muted/10">
        <p className="text-xs text-muted-foreground">
          {rows.length} row{rows.length !== 1 ? "s" : ""} returned
        </p>
      </div>
    </div>
  );
}
