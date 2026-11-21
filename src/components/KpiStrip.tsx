import { MonthComparison, MonthSummary } from '../types/finance';
import { HistoricalStats, formatBRL, formatMonthShort } from '../utils/finance';

interface KpiStripProps {
  summary: MonthSummary;
  historical: HistoricalStats;
  comparison: MonthComparison;
}

export function KpiStrip({ summary, historical, comparison }: KpiStripProps) {
  const diffFormatted =
    comparison.status === 'no_baseline'
      ? '—'
      : comparison.difference < 0
        ? `-${formatBRL(Math.abs(comparison.difference))}`
        : comparison.difference > 0
          ? `+${formatBRL(comparison.difference)}`
          : formatBRL(0);

  const diffColor =
    comparison.status === 'saving'
      ? 'text-emerald-400'
      : comparison.status === 'increase'
        ? 'text-rose-400'
        : 'text-slate-200';

  const diffSubtext =
    comparison.status === 'no_baseline'
      ? `Sem registros em ${formatMonthShort(comparison.previousMonth)}`
      : comparison.status === 'saving'
        ? `Economia vs ${formatMonthShort(comparison.previousMonth)}`
        : comparison.status === 'increase'
          ? `Acima de ${formatMonthShort(comparison.previousMonth)}`
          : `Igual a ${formatMonthShort(comparison.previousMonth)}`;

  return (
    <section
      aria-label="Indicadores do mês"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* 1. Total do mês */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
        <p className="text-xs font-medium text-slate-400">Total gasto no mês</p>
        <p
          data-testid="kpi-month-total"
          className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 tabular-nums-mono"
        >
          {formatBRL(summary.total)}
        </p>
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
          <span className="tabular-nums-mono text-slate-300">
            {summary.count} {summary.count === 1 ? 'despesa' : 'despesas'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Fixas{' '}
            <span className="tabular-nums-mono text-slate-300">
              {formatBRL(summary.fixedTotal)}
            </span>
          </span>
        </p>
      </div>

      {/* 2. Média mensal */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
        <p className="text-xs font-medium text-slate-400">Média mensal</p>
        <p
          data-testid="kpi-monthly-average"
          className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 tabular-nums-mono"
        >
          {formatBRL(historical.average)}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {historical.monthsCount > 0
            ? `Base de ${historical.monthsCount} ${
                historical.monthsCount === 1 ? 'mês registrado' : 'meses registrados'
              }`
            : 'Nenhum mês com dados ainda'}
        </p>
      </div>

      {/* 3. Diferença vs. mês anterior */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
        <p className="text-xs font-medium text-slate-400">Variação vs. anterior</p>
        <p
          data-testid="kpi-month-delta"
          className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums-mono ${diffColor}`}
        >
          {diffFormatted}
        </p>
        <p className="mt-2 text-xs text-slate-400">{diffSubtext}</p>
      </div>

      {/* 4. Maior categoria */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5">
        <p className="text-xs font-medium text-slate-400">Maior categoria</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 truncate">
          {summary.topCategory ? summary.topCategory.label : '—'}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {summary.topCategory ? (
            <>
              <span className="tabular-nums-mono text-slate-300">
                {formatBRL(summary.topCategory.total)}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums-mono">
                {summary.topCategory.share.toFixed(1).replace('.', ',')}% do total
              </span>
            </>
          ) : (
            'Sem lançamentos neste mês'
          )}
        </p>
      </div>
    </section>
  );
}
