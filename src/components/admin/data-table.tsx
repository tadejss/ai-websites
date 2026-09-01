"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  selectedKeys?: Set<string>;
  onToggleRow?: (key: string) => void;
  onToggleAll?: () => void;
  estimateSize?: number;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  estimateSize = 44,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  });

  const selectable = Boolean(onToggleRow && selectedKeys);

  return (
    <div
      ref={parentRef}
      className="max-h-[70vh] overflow-auto rounded-lg border border-[var(--admin-border)]"
    >
      <div
        className="sticky top-0 z-10 grid border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-xs uppercase tracking-wider text-[var(--admin-muted)]"
        style={{
          gridTemplateColumns: selectable
            ? `40px repeat(${columns.length}, minmax(0, 1fr))`
            : `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {selectable ? (
          <div className="flex items-center px-3 py-2">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={
                rows.length > 0 &&
                rows.every((row) => selectedKeys!.has(rowKey(row)))
              }
              onChange={() => onToggleAll?.()}
            />
          </div>
        ) : null}
        {columns.map((column) => (
          <div key={column.id} className={cn("px-3 py-2", column.className)}>
            {column.header}
          </div>
        ))}
      </div>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          const key = rowKey(row);
          return (
            <div
              key={key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="grid border-b border-[var(--admin-border)] text-sm hover:bg-[var(--admin-surface-elevated)]/50"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: selectable
                  ? `40px repeat(${columns.length}, minmax(0, 1fr))`
                  : `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {selectable ? (
                <div className="flex items-center px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${key}`}
                    checked={selectedKeys!.has(key)}
                    onChange={() => onToggleRow?.(key)}
                  />
                </div>
              ) : null}
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={cn("px-3 py-2 truncate", column.className)}
                >
                  {column.cell(row)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
