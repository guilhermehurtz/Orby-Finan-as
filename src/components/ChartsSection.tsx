import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategoryBreakdownItem, ExpenseCategory } from '../types/finance';
import {
  TimelinePoint,
  formatBRL,
  formatCompactBRL,
} from '../utils/finance';

interface ChartsSectionProps {
  timeline: TimelinePoint[];
  historicalAverage: number;
  breakdown: CategoryBreakdownItem[];
  selectedCategory: ExpenseCategory | 'all';
  onSelectCategory: (cat: ExpenseCategory | 'all') => void;
  onSelectMonth: (month: string) => void;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TimelinePoint }>;
}

function CustomBarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.12] bg-[#0B0F17] px-3.5 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-100 mb-1.5">{point.fullLabel}</p>
      <div className="space-y-1 text-slate-300">
        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-400">Total</span>
          <span className="tabular-nums-mono font-semibold text-emerald-300">
            {formatBRL(point.total)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-400">Fixas</span>
          <span className="tabular-nums-mono">{formatBRL(point.fixedTotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-400">Variáveis</span>
          <span className="tabular-nums-mono">{formatBRL(point.variableTotal)}</span>
        </div>
      </div>
      <p className="mt-2 pt-1.5 border-t border-white/[0.08] text-[11px] text-slate-500">
        Clique na barra para abrir este mês
      </p>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategoryBreakdownItem }>;
}

function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.12] bg-[#0B0F17] px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-slate-100">{item.label}</p>
      <p className="mt-1 tabular-nums-mono text-slate-200 font-semibold">
        {formatBRL(item.total)}{' '}
        <span className="text-slate-400 font-normal">
          ({item.share.toFixed(1).replace('.', ',')}%)
        </span>
      </p>
    </div>
  );
}

export function ChartsSection({
  timeline,
  historicalAverage,
  breakdown,
  selectedCategory,
  onSelectCategory,
  onSelectMonth,
}: ChartsSectionProps) {
  const hasTimelineData = timeline.some((t) => t.total > 0);
  const totalBreakdown = breakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <section
      aria-label="Gráficos de despesas"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      {/* Evolution Bar Chart */}
      <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#11161F] p-4 sm:p-5 flex flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 sm:mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Evolução mensal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare seus gastos mês a mês com a linha da média histórica
            </p>
          </div>
          {historicalAverage > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="inline-block w-4 border-t border-dashed border-amber-400/80"
                aria-hidden="true"
              />
              <span>
                Média:{' '}
                <span className="tabular-nums-mono text-slate-200 font-medium">
                  {formatBRL(historicalAverage)}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="h-[215px] sm:h-[250px] w-full min-w-0">
          {!hasTimelineData ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Adicione despesas para visualizar o gráfico de evolução mensal.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeline}
                margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                barCategoryGap="24%"
              >
                <defs>
                  <linearGradient id="barActiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barDefaultGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#1E293B" stopOpacity={0.8} />
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
                  tickFormatter={(val: number) => formatCompactBRL(val)}
                  width={62}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                {historicalAverage > 0 && (
                  <ReferenceLine
                    y={historicalAverage}
                    stroke="#F59E0B"
                    strokeOpacity={0.75}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={false}
                  onClick={(_barData, index) => {
                    const target = timeline[index];
                    if (target) {
                      onSelectMonth(target.month);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {timeline.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={
                        entry.isSelected
                          ? 'url(#barActiveGradient)'
                          : 'url(#barDefaultGradient)'
                      }
                      stroke={entry.isSelected ? '#34D399' : 'transparent'}
                      strokeWidth={entry.isSelected ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Distribution Donut + Breakdown */}
      <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#11161F] p-4 sm:p-5 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Por categoria
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em uma categoria para filtrar a lista
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {breakdown.length === 0 ? (
          <div className="flex-1 min-h-[240px] flex items-center justify-center text-sm text-slate-500 text-center px-4">
            Sem categorias neste mês.
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
            <div className="sm:col-span-5 h-[190px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={2.5}
                    stroke="#11161F"
                    strokeWidth={2}
                    isAnimationActive={false}
                    onClick={(_sliceData, index) => {
                      const item = breakdown[index];
                      if (item) {
                        onSelectCategory(
                          selectedCategory === item.category ? 'all' : item.category
                        );
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {breakdown.map((entry) => {
                      const dimmed =
                        selectedCategory !== 'all' &&
                        selectedCategory !== entry.category;
                      return (
                        <Cell
                          key={entry.category}
                          fill={entry.color}
                          fillOpacity={dimmed ? 0.28 : 0.95}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-slate-400">Total</span>
                <span className="text-xs font-semibold text-slate-100 tabular-nums-mono mt-0.5">
                  {formatCompactBRL(totalBreakdown)}
                </span>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-1.5 max-h-[230px] overflow-y-auto pr-1">
              {breakdown.map((item) => {
                const isSelected = selectedCategory === item.category;
                const isDimmed = selectedCategory !== 'all' && !isSelected;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() =>
                      onSelectCategory(isSelected ? 'all' : item.category)
                    }
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isSelected
                        ? 'bg-white/[0.08] text-slate-50'
                        : 'hover:bg-white/[0.04] text-slate-300'
                    } ${isDimmed ? 'opacity-45' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 tabular-nums-mono">
                      <span className="text-slate-400">
                        {item.share.toFixed(0)}%
                      </span>
                      <span className="text-slate-100 font-medium">
                        {formatBRL(item.total)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
