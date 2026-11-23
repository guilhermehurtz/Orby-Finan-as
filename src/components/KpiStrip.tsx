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
      className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4"
    >
      {/* 1. Total do mês */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-3.5 sm:p-5">
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          Total no mês
        </p>
        <p
          data-testid="kpi-month-total"
          className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-50 tabular-nums-mono truncate"
        >
          {formatBRL(summary.total)}
        </p>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 flex-wrap">
          <span className="tabular-nums-mono text-slate-300">
            {summary.count} {summary.count === 1 ? 'item' : 'itens'}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="hidden sm:inline">
            Fixas{' '}
            <span className="tabular-nums-mono text-slate-300">
              {formatBRL(summary.fixedTotal)}
            </span>
          </span>
        </p>
      </div>

      {/* 2. Média mensal */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-3.5 sm:p-5">
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          Média mensal
        </p>
        <p
          data-testid="kpi-monthly-average"
          className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-50 tabular-nums-mono truncate"
        >
          {formatBRL(historical.average)}
        </p>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
          {historical.monthsCount > 0
            ? `Base de ${historical.monthsCount} ${
                historical.monthsCount === 1 ? 'mês' : 'meses'
              }`
            : 'Sem dados ainda'}
        </p>
      </div>

      {/* 3. Diferença vs. mês anterior */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-3.5 sm:p-5">
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          vs. mês anterior
        </p>
        <p
          data-testid="kpi-month-delta"
          className={`mt-1.5 sm:mt-2 text-lg sm:text-2xl font-semibold tracking-tight tabular-nums-mono truncate ${diffColor}`}
        >
          {diffFormatted}
        </p>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
          {diffSubtext}
        </p>
      </div>

      {/* 4. Maior categoria */}
      <div className="rounded-xl border border-white/[0.08] bg-[#11161F] p-3.5 sm:p-5">
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          Maior categoria
        </p>
        <p className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-semibold tracking-tight text-slate-50 truncate">
          {summary.topCategory ? summary.topCategory.label : '—'}
        </p>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
          {summary.topCategory ? (
            <>
              <span className="tabular-nums-mono text-slate-300">
                {formatBRL(summary.topCategory.total)}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums-mono">
                {summary.topCategory.share.toFixed(0)}%
              </span>
            </>
          ) : (
            'Sem lançamentos'
          )}
        </p>
      </div>
    </section>
  );
}
