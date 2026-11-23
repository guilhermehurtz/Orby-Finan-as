import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react';
import { MonthComparison } from '../types/finance';
import { formatBRL, formatMonthNameLower } from '../utils/finance';

interface ComparisonBannerProps {
  comparison: MonthComparison;
  historicalAverage: number;
  monthsCount: number;
}

export function ComparisonBanner({
  comparison,
  historicalAverage,
  monthsCount,
}: ComparisonBannerProps) {
  const prevName = formatMonthNameLower(comparison.previousMonth);
  const currName = formatMonthNameLower(comparison.currentMonth);
  const absDiff = Math.abs(comparison.difference);
  const absPct =
    comparison.percentChange !== null
      ? `${Math.abs(comparison.percentChange).toFixed(1).replace('.', ',')}%`
      : null;

  const avgDelta =
    monthsCount >= 2 && comparison.currentTotal > 0
      ? comparison.currentTotal - historicalAverage
      : null;

  if (comparison.status === 'no_baseline') {
    return (
      <section
        aria-label="Resumo comparativo mensal"
        className="rounded-xl border border-white/[0.08] bg-gradient-to-r from-slate-800/40 via-[#11161F] to-[#11161F] px-5 py-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Sem base em {prevName} para comparar variação mensal
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Quando houver despesas em meses consecutivos, o orby calcula automaticamente sua economia ou aumento.
              </p>
            </div>
          </div>
          {avgDelta !== null && (
            <div className="text-xs text-slate-400 sm:text-right shrink-0">
              <span>Média histórica: </span>
              <span className="tabular-nums-mono text-slate-200 font-medium">
                {formatBRL(historicalAverage)}
              </span>
            </div>
          )}
        </div>
      </section>
    );
  }

  const isSaving = comparison.status === 'saving';
  const isIncrease = comparison.status === 'increase';

  const containerStyle = isSaving
    ? 'border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.11] via-teal-500/[0.04] to-[#11161F]'
    : isIncrease
      ? 'border-rose-500/25 bg-gradient-to-r from-rose-500/[0.11] via-rose-500/[0.03] to-[#11161F]'
      : 'border-white/[0.08] bg-[#11161F]';

  const iconBoxStyle = isSaving
    ? 'bg-emerald-500/15 text-emerald-300'
    : isIncrease
      ? 'bg-rose-500/15 text-rose-300'
      : 'bg-slate-800 text-slate-300';

  const headline = isSaving
    ? `Economia de ${formatBRL(absDiff)} em relação a ${prevName}`
    : isIncrease
      ? `Aumento de ${formatBRL(absDiff)} em relação a ${prevName}`
      : `Mesmo patamar de gastos de ${prevName}`;

  const Icon = isSaving ? ArrowDownRight : isIncrease ? ArrowUpRight : Minus;

  return (
    <section
      aria-label="Resumo comparativo mensal"
      className={`rounded-xl border px-5 py-4 ${containerStyle}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBoxStyle}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm sm:text-base font-semibold text-slate-50">
                {headline}
              </p>
              {absPct && (
                <span
                  className={`text-xs font-medium tabular-nums-mono ${
                    isSaving
                      ? 'text-emerald-300'
                      : isIncrease
                        ? 'text-rose-300'
                        : 'text-slate-400'
                  }`}
                >
                  ({isSaving ? '-' : isIncrease ? '+' : ''}
                  {absPct})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                {prevName.charAt(0).toUpperCase() + prevName.slice(1)}:{' '}
                <strong className="font-medium text-slate-200 tabular-nums-mono">
                  {formatBRL(comparison.previousTotal)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {currName.charAt(0).toUpperCase() + currName.slice(1)}:{' '}
                <strong className="font-medium text-slate-200 tabular-nums-mono">
                  {formatBRL(comparison.currentTotal)}
                </strong>
              </span>
              {avgDelta !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {avgDelta <= 0
                      ? `${formatBRL(Math.abs(avgDelta))} abaixo da sua média`
                      : `${formatBRL(avgDelta)} acima da sua média`}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
