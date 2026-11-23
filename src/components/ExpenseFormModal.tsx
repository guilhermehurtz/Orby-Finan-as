import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Layers, X } from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  ExpenseType,
  InstallmentActionScope,
  InstallmentAmountMode,
  PaymentMethod,
} from '../types/finance';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  calculateInstallmentPreview,
  formatBRL,
  formatMonthShort,
  isValidMonthKey,
  parseBRLInput,
} from '../utils/finance';

export interface ExpenseFormValues {
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  month: string;
  day: number;
  note?: string;
  isInstallment?: boolean;
  installmentsCount?: number;
  startingInstallment?: number;
  installmentAmountMode?: InstallmentAmountMode;
  editScope?: InstallmentActionScope;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  defaultMonth: string;
  defaultPaymentMethod?: PaymentMethod;
  editingExpense: Expense | null;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues, existingId?: string) => void;
}

const QUICK_INSTALLMENT_PRESETS = [2, 3, 6, 10, 12];

export function ExpenseFormModal({
  isOpen,
  defaultMonth,
  defaultPaymentMethod = 'pix',
  editingExpense,
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [type, setType] = useState<ExpenseType>('variavel');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [month, setMonth] = useState(defaultMonth);
  const [dayText, setDayText] = useState(String(new Date().getDate()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Installment creation fields
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCountText, setInstallmentsCountText] = useState('12');
  const [startingInstallmentText, setStartingInstallmentText] = useState('1');
  const [amountMode, setAmountMode] = useState<InstallmentAmountMode>('total');

  // Installment edit scope (when editing an existing installment)
  const [editScope, setEditScope] = useState<InstallmentActionScope>('single');

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setName(editingExpense.name);
      setAmountText(editingExpense.amount.toFixed(2).replace('.', ','));
      setCategory(editingExpense.category);
      setType(editingExpense.type);
      setPaymentMethod(editingExpense.paymentMethod ?? 'pix');
      setMonth(editingExpense.month);
      setDayText(String(editingExpense.day));
      setNote(editingExpense.note ?? '');
      setIsInstallment(false);
      setEditScope('single');
    } else {
      setName('');
      setAmountText('');
      setCategory('alimentacao');
      setType('variavel');
      setPaymentMethod(defaultPaymentMethod);
      setMonth(defaultMonth);
      setDayText(String(new Date().getDate()));
      setNote('');
      setIsInstallment(false);
      setInstallmentsCountText('12');
      setStartingInstallmentText('1');
      setAmountMode('total');
      setEditScope('single');
    }
    setError(null);
    // Avoid auto-focusing on small touch screens to prevent jarring iOS keyboard jump
    if (window.innerWidth >= 640) {
      const timer = window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 30);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, editingExpense, defaultMonth, defaultPaymentMethod]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const parsedAmountPreview = useMemo(
    () => parseBRLInput(amountText),
    [amountText]
  );

  const installmentPreview = useMemo(() => {
    if (!isInstallment || editingExpense) return null;
    const totalCount = Number(installmentsCountText);
    const startIdx = Number(startingInstallmentText) || 1;
    if (
      !Number.isInteger(totalCount) ||
      totalCount < 2 ||
      totalCount > 60 ||
      !isValidMonthKey(month)
    ) {
      return null;
    }
    const clampedStart = Math.max(1, Math.min(totalCount, Math.round(startIdx)));
    const amountForPreview = parsedAmountPreview ?? 0;
    return calculateInstallmentPreview(
      amountForPreview,
      totalCount,
      clampedStart,
      amountMode,
      month
    );
  }, [
    isInstallment,
    editingExpense,
    installmentsCountText,
    startingInstallmentText,
    month,
    parsedAmountPreview,
    amountMode,
  ]);

  if (!isOpen) return null;

  const isEditingInstallment = Boolean(
    editingExpense?.installmentGroupId &&
      editingExpense?.installmentTotal &&
      editingExpense?.installmentCurrent
  );

  const handleToggleInstallment = (next: boolean) => {
    setIsInstallment(next);
    if (next && paymentMethod === 'pix') {
      setPaymentMethod('credito');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da despesa.');
      return;
    }

    const parsedAmount = parseBRLInput(amountText);
    if (parsedAmount === null) {
      setError('Informe um valor válido maior que zero (ex.: 149,90).');
      return;
    }

    if (!isValidMonthKey(month)) {
      setError('Selecione um mês de referência válido.');
      return;
    }

    const parsedDay = Number(dayText);
    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('Informe um dia entre 1 e 31.');
      return;
    }

    let installmentsCount: number | undefined;
    let startingInstallment: number | undefined;

    if (!editingExpense && isInstallment) {
      const count = Number(installmentsCountText);
      if (!Number.isInteger(count) || count < 2 || count > 60) {
        setError('Informe entre 2 e 60 parcelas.');
        return;
      }
      const start = Number(startingInstallmentText);
      if (!Number.isInteger(start) || start < 1 || start > count) {
        setError(`A parcela inicial deve estar entre 1 e ${count}.`);
        return;
      }
      installmentsCount = count;
      startingInstallment = start;
    }

    onSubmit(
      {
        name: trimmedName,
        amount: parsedAmount,
        category,
        type,
        paymentMethod,
        month,
        day: parsedDay,
        note: note.trim() || undefined,
        isInstallment: !editingExpense && isInstallment,
        installmentsCount,
        startingInstallment,
        installmentAmountMode: amountMode,
        editScope: isEditingInstallment ? editScope : 'single',
      },
      editingExpense?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/[0.1] bg-[#11161F] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] shrink-0">
          <div>
            <h2
              id="expense-modal-title"
              className="text-base font-semibold text-slate-50"
            >
              {editingExpense ? 'Editar despesa' : 'Nova despesa'}
            </h2>
            {isEditingInstallment && editingExpense && (
              <p className="text-xs text-sky-300 mt-0.5 flex items-center gap-1.5">
                <Layers className="h-3 w-3" aria-hidden="true" />
                <span>
                  Parcela {editingExpense.installmentCurrent}/
                  {editingExpense.installmentTotal}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 safe-bottom"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="modal-expense-name"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Nome da despesa
            </label>
            <input
              ref={nameInputRef}
              id="modal-expense-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: SSD 1TB, Supermercado, Aluguel..."
              className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-expense-amount"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                {!editingExpense && isInstallment
                  ? amountMode === 'total'
                    ? 'Valor total da compra (R$)'
                    : 'Valor de cada parcela (R$)'
                  : 'Valor (R$)'}
              </label>
              <input
                id="modal-expense-amount"
                type="text"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => {
                  setAmountText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0,00"
                className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 tabular-nums-mono placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="modal-expense-category"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Categoria
              </label>
              <select
                id="modal-expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#11161F]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Forma de pagamento
            </span>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-lg bg-[#0A0D12] border border-white/[0.08]"
              role="group"
              aria-label="Forma de pagamento"
            >
              {PAYMENT_METHODS.map((pm) => {
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    aria-pressed={active}
                    className={`min-h-[38px] py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white/[0.12] text-slate-50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Installments Toggle & Options (New Expense only) */}
          {!editingExpense && (
            <div className="rounded-xl border border-white/[0.08] bg-[#0A0D12]/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100">
                      Compra parcelada
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Repete automaticamente nos próximos meses com o nº da parcela
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isInstallment}
                  aria-label="Ativar compra parcelada"
                  onClick={() => handleToggleInstallment(!isInstallment)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isInstallment
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-white/[0.08] border-white/[0.12]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      isInstallment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isInstallment && (
                <div className="pt-3 border-t border-white/[0.07] space-y-3">
                  {/* Quick Installment Count Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_INSTALLMENT_PRESETS.map((preset) => {
                      const active = Number(installmentsCountText) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setInstallmentsCountText(String(preset));
                            if (Number(startingInstallmentText) > preset) {
                              setStartingInstallmentText('1');
                            }
                          }}
                          className={`min-h-[34px] px-3 rounded-md text-xs font-medium tabular-nums-mono transition-colors ${
                            active
                              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                              : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08]'
                          }`}
                        >
                          {preset}x
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="modal-installments-count"
                        className="block text-[11px] font-medium text-slate-400 mb-1"
                      >
                        Total de parcelas
                      </label>
                      <input
                        id="modal-installments-count"
                        type="number"
                        inputMode="numeric"
                        min={2}
                        max={60}
                        value={installmentsCountText}
                        onChange={(e) => {
                          setInstallmentsCountText(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full min-h-[42px] rounded-lg border border-white/[0.1] bg-[#11161F] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="modal-installments-start"
                        className="block text-[11px] font-medium text-slate-400 mb-1"
                      >
                        Começar na parcela
                      </label>
                      <input
                        id="modal-installments-start"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={Number(installmentsCountText) || 60}
                        value={startingInstallmentText}
                        onChange={(e) => {
                          setStartingInstallmentText(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full min-h-[42px] rounded-lg border border-white/[0.1] bg-[#11161F] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Amount mode toggle: Total vs Per Installment */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 mb-1">
                      O valor digitado acima é:
                    </span>
                    <div
                      className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#11161F] border border-white/[0.08]"
                      role="group"
                      aria-label="Tipo do valor parcelado"
                    >
                      <button
                        type="button"
                        onClick={() => setAmountMode('total')}
                        aria-pressed={amountMode === 'total'}
                        className={`min-h-[36px] text-xs font-medium rounded-md transition-colors ${
                          amountMode === 'total'
                            ? 'bg-white/[0.12] text-slate-50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Valor total (dividir)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountMode('installment')}
                        aria-pressed={amountMode === 'installment'}
                        className={`min-h-[36px] text-xs font-medium rounded-md transition-colors ${
                          amountMode === 'installment'
                            ? 'bg-white/[0.12] text-slate-50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Valor da parcela
                      </button>
                    </div>
                  </div>

                  {/* Live Installment Schedule Preview */}
                  {installmentPreview && (
                    <div
                      data-testid="modal-installment-preview"
                      className="rounded-lg border border-sky-500/25 bg-sky-500/[0.08] px-3.5 py-2.5 text-xs space-y-1"
                    >
                      <p className="text-sky-200 font-medium">
                        {parsedAmountPreview ? (
                          <>
                            {installmentPreview.countToCreate}x de{' '}
                            <span className="tabular-nums-mono font-semibold text-white">
                              {formatBRL(installmentPreview.perInstallment)}
                            </span>{' '}
                            <span className="text-sky-200/80">
                              (total {formatBRL(installmentPreview.totalAmount)})
                            </span>
                          </>
                        ) : (
                          <>
                            Serão criadas {installmentPreview.countToCreate}{' '}
                            parcelas ({installmentPreview.startingInstallment}/
                            {installmentPreview.installmentsTotal} até{' '}
                            {installmentPreview.installmentsTotal}/
                            {installmentPreview.installmentsTotal})
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-sky-200/75 tabular-nums-mono">
                        De {formatMonthShort(month)} até{' '}
                        {formatMonthShort(installmentPreview.endMonth)} · encerra
                        após {installmentPreview.installmentsTotal}/
                        {installmentPreview.installmentsTotal}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit Scope Selector when editing an installment */}
          {isEditingInstallment && editingExpense && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3.5 space-y-2">
              <span className="block text-xs font-medium text-sky-200">
                Aplicar alteração em:
              </span>
              <div
                className="grid grid-cols-2 gap-1.5"
                role="group"
                aria-label="Escopo da edição da parcela"
              >
                <button
                  type="button"
                  onClick={() => setEditScope('single')}
                  aria-pressed={editScope === 'single'}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    editScope === 'single'
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-100'
                      : 'bg-[#0A0D12] border-white/[0.08] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Só parcela {editingExpense.installmentCurrent}/
                  {editingExpense.installmentTotal}
                </button>
                <button
                  type="button"
                  onClick={() => setEditScope('future')}
                  aria-pressed={editScope === 'future'}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    editScope === 'future'
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-100'
                      : 'bg-[#0A0D12] border-white/[0.08] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Esta e as próximas
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Tipo
              </span>
              <div
                className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0A0D12] border border-white/[0.08]"
                role="group"
                aria-label="Tipo da despesa"
              >
                <button
                  type="button"
                  onClick={() => setType('variavel')}
                  aria-pressed={type === 'variavel'}
                  className={`min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'variavel'
                      ? 'bg-white/[0.1] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Variável
                </button>
                <button
                  type="button"
                  onClick={() => setType('fixa')}
                  aria-pressed={type === 'fixa'}
                  className={`min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'fixa'
                      ? 'bg-white/[0.1] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fixa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:contents gap-3">
              <div>
                <label
                  htmlFor="modal-expense-month"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  {!editingExpense && isInstallment ? 'Mês inicial' : 'Mês'}
                </label>
                <input
                  id="modal-expense-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-expense-day"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Dia
                </label>
                <input
                  id="modal-expense-day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={dayText}
                  onChange={(e) => setDayText(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-expense-note"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Observação (opcional)
            </label>
            <input
              id="modal-expense-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Kabum, garantia, nota fiscal..."
              className="w-full min-h-[44px] rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 rounded-lg hover:bg-white/[0.05] transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-[#04130D] rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {editingExpense
                ? 'Salvar alterações'
                : isInstallment && installmentPreview
                  ? `Salvar ${installmentPreview.countToCreate} parcelas`
                  : 'Salvar despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
