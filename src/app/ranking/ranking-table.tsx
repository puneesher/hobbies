"use client";

import { useMemo, useState } from "react";

export type RankingRow = {
  [key: string]: string | number | null | undefined;
};

type SortDirection = "asc" | "desc";

type Column = {
  key: string;
  label: string;
  align: string;
  type: "number" | "string";
};

const columns: Column[] = [
  { key: "rank", label: "#", align: "text-right", type: "number" },
  { key: "player", label: "Player", align: "text-left", type: "string" },
  { key: "points", label: "Pts", align: "text-right", type: "number" },
  { key: "tournaments", label: "Tourn.", align: "text-right", type: "number" },
  { key: "games", label: "Games", align: "text-right", type: "number" },
  { key: "wins", label: "Wins", align: "text-right", type: "number" },
  { key: "losses", label: "Losses", align: "text-right", type: "number" },
  { key: "pctg", label: "Win %", align: "text-right", type: "number" },
  { key: "pf", label: "PF", align: "text-right", type: "number" },
  { key: "pa", label: "PA", align: "text-right", type: "number" },
  { key: "diff", label: "Diff", align: "text-right", type: "number" },
];

function valueFor(row: RankingRow, key: string) {
  return row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()];
}

function formatCell(row: RankingRow, key: string, rank: number) {
  if (key === "rank") {
    return rank;
  }

  const value = valueFor(row, key);

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "pctg") {
    return `${Number(value).toFixed(2)}%`;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  return value;
}

function compareRows(
  a: RankingRow,
  b: RankingRow,
  key: string,
  direction: SortDirection,
  aRank: number,
  bRank: number,
) {
  const modifier = direction === "asc" ? 1 : -1;

  if (key === "rank") {
    return (aRank - bRank) * modifier;
  }

  const aValue = valueFor(a, key);
  const bValue = valueFor(b, key);

  if (typeof aValue === "number" || typeof bValue === "number") {
    return (Number(aValue ?? 0) - Number(bValue ?? 0)) * modifier;
  }

  return String(aValue ?? "").localeCompare(String(bValue ?? "")) * modifier;
}

export default function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [sortKey, setSortKey] = useState("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRows = useMemo(() => {
    return rows
      .map((row, index) => ({ row, rank: index + 1 }))
      .sort((a, b) => {
        const comparison = compareRows(
          a.row,
          b.row,
          sortKey,
          sortDirection,
          a.rank,
          b.rank,
        );

        return comparison === 0 ? a.rank - b.rank : comparison;
      })
  }, [rows, sortDirection, sortKey]);

  function updateSort(nextKey: string) {
    if (nextKey === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    const nextColumn = columns.find((column) => column.key === nextKey);

    setSortKey(nextKey);
    setSortDirection(nextColumn?.type === "string" ? "asc" : "desc");
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
            <tr>
              {columns.map((column) => {
                const isActive = column.key === sortKey;
                const sortLabel = isActive
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sortLabel}
                    className={`whitespace-nowrap border-b border-zinc-200 px-2 py-2 font-semibold ${column.align}`}
                  >
                    <button
                      type="button"
                      onClick={() => updateSort(column.key)}
                      className={`inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-semibold uppercase hover:bg-zinc-200 ${
                        column.align === "text-right"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <span>{column.label}</span>
                      <span className="inline-block w-3 text-center text-zinc-500">
                        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedRows.length > 0 ? (
              sortedRows.map(({ row, rank }) => {
                const player = String(valueFor(row, "player") ?? rank);

                return (
                  <tr key={`${player}-${rank}`} className="hover:bg-zinc-50">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`whitespace-nowrap px-4 py-3 ${column.align} ${
                          column.key === "player"
                            ? "font-medium text-zinc-950"
                            : "text-zinc-700"
                        }`}
                      >
                        {formatCell(row, column.key, rank)}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-zinc-600"
                >
                  No ranking results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
