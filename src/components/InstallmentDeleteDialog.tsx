import { useEffect } from 'react';
import { Layers, Trash2, X } from 'lucide-react';
import { Expense, InstallmentActionScope } from '../types/finance';
import { formatBRL, formatMonthShort } from '../utils/finance';

interface InstallmentDeleteDialogProps {
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: (expense: Expense, scope: InstallmentActionScope) => void;
}

export function InstallmentDeleteDialog({
  expense,
  onCancel,
  onConfirm,
}: InstallmentDeleteDialogProps) {
  useEffect(() => {
    if (!expense) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expense, onCancel]);

  if (!expense) return null;

  const current = expense.installmentCurrent ?? 1;
  const total = expense.installmentTotal ?? 2;
  const hasFuture = current < total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="installment-delete-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/[0.1] bg-[#11161F] shadow-2xl overflow-hidden safe-bottom">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2
              id="installment-delete-title"
              className="text-base font-semibold text-slate-50"
            >
              Excluir compra parcelada
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar diálogo"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-white/[0.07] bg-[#0A0D12] px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">
                {expense.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
                <span>
                  Parcela {current}/{total} · {formatMonthShort(expense.month)}
                </span>
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-100 tabular-nums-mono shrink-0">
              {formatBRL(expense.amount)}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Escolha quais parcelas deseja remover do seu controle:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onConfirm(expense, 'single')}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-left transition-colors"
            >
              <p className="text-sm font-medium text-slate-100">
                Só esta parcela ({current}/{total})
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Mantém as demais parcelas nos outros meses
              </p>
            </button>

            {hasFuture && (
              <button
                type="button"
                onClick={() => onConfirm(expense, 'future')}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] text-left transition-colors"
              >
                <p className="text-sm font-medium text-amber-200">
                  Esta e as próximas ({current}/{total} até {total}/{total})
                </p>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Mantém o histórico das parcelas anteriores já pagas
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={() => onConfirm(expense, 'all')}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.1] hover:bg-rose-500/[0.18] text-left transition-colors"
            >
              <p className="text-sm font-medium text-rose-200">
                Todas as {total} parcelas desta compra
              </p>
              <p className="text-xs text-rose-200/70 mt-0.5">
                Remove a compra inteira de todos os meses
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[44px] rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
