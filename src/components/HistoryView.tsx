import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  HistoricalStats,
  RecordedMonthRow,
  formatBRL,
  formatCompactBRL,
  formatMonthLabel,
  formatMonthShort,
  isValidMonthKey,
} from '../utils/finance';

interface HistoryViewProps {
  rows: RecordedMonthRow[];
  historical: HistoricalStats;
  onOpenMonth: (month: string) => void;
}

export function HistoryView({
  rows,
  historical,
  onOpenMonth,
}: HistoryViewProps) {
  const [jumpMonth, setJumpMonth] = useState('');

  const chronologicalData = [...rows].reverse().map((r) => ({
    month: r.summary.month,
    shortLabel: formatMonthShort(r.summary.month),
    fullLabel: formatMonthLabel(r.summary.month),
    total: r.summary.total,
    fixedTotal: r.summary.fixedTotal,
    variableTotal: r.summary.variableTotal,
  }));

  const handleJump = () => {
    if (isValidMonthKey(jumpMonth)) {
      onOpenMonth(jumpMonth);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Jump to Month */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            Histórico Mensal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe todos os meses salvos e compare sua evolução financeira ao longo do tempo
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label
              htmlFor="history-jump-month"
              className="block text-xs text-slate-400 mb-1"
            >
              Abrir ou iniciar outro mês
            </label>
            <input
              id="history-jump-month"
              type="month"
              value={jumpMonth}
              onChange={(e) => setJumpMonth(e.target.value)}
              className="h-9 rounded-lg border border-white/[0.1] bg-[#11161F] px-3 text-xs text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleJump}
            disabled={!isValidMonthKey(jumpMonth)}
            className="h-9 px-3.5 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            Ir para mês
          </button>
        </div>
      </div>

      {/* Historical KPI Strip */}
      <section
        aria-label="Resumo histórico"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
          <p className="text-xs font-medium text-slate-400">Total acumulado</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50 tabular-nums-mono">
            {formatBRL(historical.grandTotal)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Em {historical.monthsCount}{' '}
            {historical.monthsCount === 1 ? 'mês registrado' : 'meses registrados'}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
          <p className="text-xs font-medium text-slate-400">Média por mês</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50 tabular-nums-mono">
            {formatBRL(historical.average)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Referência de equilíbrio mensal
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
          <p className="text-xs font-medium text-slate-400">Mês mais econômico</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400 tabular-nums-mono">
            {historical.lowestMonth ? formatBRL(historical.lowestMonth.total) : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {historical.lowestMonth
              ? formatMonthLabel(historical.lowestMonth.month)
              : 'Sem dados'}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
          <p className="text-xs font-medium text-slate-400">Mês de maior gasto</p>
          <p className="mt-2 text-2xl font-semibold text-rose-400 tabular-nums-mono">
            {historical.highestMonth ? formatBRL(historical.highestMonth.total) : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {historical.highestMonth
              ? formatMonthLabel(historical.highestMonth.month)
              : 'Sem dados'}
          </p>
        </div>
      </section>

      {/* Area Trend Chart */}
      {chronologicalData.length > 0 && (
        <section
          aria-label="Tendência histórica de gastos"
          className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Curva de gastos acumulados
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tendência completa dos meses com lançamentos
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Média:{' '}
              <span className="tabular-nums-mono text-amber-300 font-medium">
                {formatBRL(historical.average)}
              </span>
            </span>
          </div>

          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chronologicalData}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="historyAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(v: number) => formatCompactBRL(v)}
                  width={62}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatBRL(Number(value ?? 0)), 'Total']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                {historical.average > 0 && (
                  <ReferenceLine
                    y={historical.average}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    strokeOpacity={0.75}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#34D399"
                  strokeWidth={2.5}
                  fill="url(#historyAreaFill)"
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: '#34D399', stroke: '#0A0D12', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recorded Months Table */}
      <section
        aria-label="Tabela de meses registrados"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h2 className="text-base font-semibold text-slate-100">
            Detalhamento por mês
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Nenhum mês registrado ainda. Adicione despesas na Visão Geral para montar seu histórico.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs font-medium text-slate-400">
                  <th className="py-3 pl-5 pr-3 font-medium">Mês</th>
                  <th className="py-3 px-3 font-medium">Itens</th>
                  <th className="py-3 px-3 font-medium">Fixas / Variáveis</th>
                  <th className="py-3 px-3 font-medium">Variação vs. anterior</th>
                  <th className="py-3 px-3 font-medium text-right">Total</th>
                  <th className="py-3 pl-3 pr-5 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {rows.map(({ summary, comparison }) => {
                  const isSaving = comparison.status === 'saving';
                  const isIncrease = comparison.status === 'increase';
                  return (
                    <tr
                      key={summary.month}
                      className="hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-3 font-medium text-slate-100 whitespace-nowrap">
                        {formatMonthLabel(summary.month)}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-400 tabular-nums-mono whitespace-nowrap">
                        {summary.count}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                        <span className="tabular-nums-mono text-slate-300">
                          {formatBRL(summary.fixedTotal)}
                        </span>
                        <span aria-hidden="true"> / </span>
                        <span className="tabular-nums-mono text-slate-400">
                          {formatBRL(summary.variableTotal)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs whitespace-nowrap">
                        {comparison.status === 'no_baseline' ? (
                          <span className="text-slate-500">Sem base anterior</span>
                        ) : isSaving ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 tabular-nums-mono">
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                            Economia de {formatBRL(Math.abs(comparison.difference))}
                          </span>
                        ) : isIncrease ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 tabular-nums-mono">
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            +{formatBRL(Math.abs(comparison.difference))}
                          </span>
                        ) : (
                          <span className="text-slate-400">Estável (0%)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-100 tabular-nums-mono whitespace-nowrap">
                        {formatBRL(summary.total)}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenMonth(summary.month)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <span>Abrir</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
