import { connection } from "next/server";
import { getRankingRows, getCurrentYearStart } from "@/lib/ranking";
import RankingTable, { type RankingRow } from "./ranking-table";

export default async function RankingPage() {
  await connection();

  const rows = (await getRankingRows()) as RankingRow[];
  const currentYearStart = getCurrentYearStart();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
              Ranking
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Results since {currentYearStart}
            </p>
          </div>
          <div className="text-sm font-medium text-zinc-700">
            {rows.length} players
          </div>
        </header>

        <RankingTable rows={rows} />
      </div>
    </main>
  );
}
