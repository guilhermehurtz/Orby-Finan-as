import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Download,
  HardDriveUpload,
  Loader2,
  LogOut,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { FinanceStoreData } from '../types/finance';
import { formatBRL, parseBRLInput, validateBackupPayload } from '../utils/finance';

interface DataBackupViewProps {
  store: FinanceStoreData;
  monthsCount: number;
  username: string;
  authProviderLabel: string;
  localMigrationCount: number;
  onUpdateGoal: (goal: number | null) => Promise<void>;
  onImportStore: (data: FinanceStoreData) => Promise<void>;
  onImportLocalToCloud: () => Promise<void>;
  onRestoreDemo: () => Promise<void>;
  onClearAll: () => Promise<void>;
  onSignOut: () => void;
}

export function DataBackupView({
  store,
  monthsCount,
  username,
  authProviderLabel,
  localMigrationCount,
  onUpdateGoal,
  onImportStore,
  onImportLocalToCloud,
  onRestoreDemo,
  onClearAll,
  onSignOut,
}: DataBackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [goalInput, setGoalInput] = useState(
    store.monthlyGoal ? store.monthlyGoal.toFixed(2).replace('.', ',') : ''
  );
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    'import' | 'local' | 'demo' | 'clear' | null
  >(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Sync goal input when cloud profile loads or updates from another device
  useEffect(() => {
    setGoalInput(
      store.monthlyGoal ? store.monthlyGoal.toFixed(2).replace('.', ',') : ''
    );
  }, [store.monthlyGoal]);

  const handleSaveGoal = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = goalInput.trim();
    if (!trimmed) {
      setSavingGoal(true);
      try {
        await onUpdateGoal(null);
        setGoalFeedback('Meta mensal removida.');
      } finally {
        setSavingGoal(false);
      }
      return;
    }
    const parsed = parseBRLInput(trimmed);
    if (parsed === null) {
      setGoalFeedback('Informe um valor válido maior que zero.');
      return;
    }
    setSavingGoal(true);
    try {
      await onUpdateGoal(parsed);
      setGoalFeedback(`Meta mensal atualizada para ${formatBRL(parsed)}.`);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleExport = () => {
    const payload: FinanceStoreData = {
      version: 1,
      expenses: store.expenses,
      monthlyGoal: store.monthlyGoal ?? null,
      seeded: false,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orby-backup-${today}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setImportStatus({
      type: 'success',
      message: `Backup exportado com ${store.expenses.length} despesas.`,
    });
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validated = validateBackupPayload(parsed);
        if (!validated.ok) {
          setImportStatus({ type: 'error', message: validated.error });
          return;
        }
        setBusyAction('import');
        await onImportStore(validated.data);
        setGoalInput(
          validated.data.monthlyGoal
            ? validated.data.monthlyGoal.toFixed(2).replace('.', ',')
            : ''
        );
        setImportStatus({
          type: 'success',
          message: `Backup enviado para sua conta (${validated.data.expenses.length} despesas sincronizadas).`,
        });
      } catch {
        setImportStatus({
          type: 'error',
          message:
            'Não foi possível importar o arquivo JSON. Verifique o formato e tente novamente.',
        });
      } finally {
        setBusyAction(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLocalMigration = async () => {
    setBusyAction('local');
    try {
      await onImportLocalToCloud();
      setImportStatus({
        type: 'success',
        message: 'Despesas locais importadas e sincronizadas com sua conta na nuvem.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleClearConfirm = async () => {
    setBusyAction('clear');
    try {
      await onClearAll();
      setConfirmClear(false);
      setImportStatus({
        type: 'success',
        message:
          'Todos os registros foram removidos da sua conta. Você está começando do zero.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestoreDemoClick = async () => {
    setBusyAction('demo');
    try {
      await onRestoreDemo();
      setConfirmClear(false);
      setImportStatus({
        type: 'success',
        message: 'Dados de exemplo carregados na sua conta.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl">
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden ring-1 ring-white/15 bg-[#EAF4FF] shrink-0 shadow-md">
          <img
            src="/assets/aistudio/Orby_app_icon_and_logo_35b50344_2K_8e4087db.jpg"
            alt="Logo oficial orby"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover scale-[1.06]"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-50">
            Conta, Nuvem e Backup
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Suas despesas, parcelas e metas ficam salvas na nuvem e sincronizam entre computador, iPhone e qualquer navegador.
          </p>
        </div>
      </div>

      {/* Connected Cloud Account */}
      <section
        aria-label="Conta conectada na nuvem"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <Cloud className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-100 truncate">
                  @{username}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acesso via {authProviderLabel} · Sincronização automática na nuvem
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-200 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sair da conta</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.07] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400">Despesas salvas</p>
                <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums-mono">
                  {store.expenses.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Meses no histórico</p>
                <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums-mono">
                  {monthsCount}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">Armazenamento</p>
                <p className="mt-1 text-sm font-medium text-emerald-300">
                  Nuvem isolada por conta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional one-click local-to-cloud migration */}
      {localMigrationCount > 0 && (
        <section
          aria-label="Importar dados locais anteriores"
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <HardDriveUpload
              className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-semibold text-emerald-100">
                Encontramos {localMigrationCount}{' '}
                {localMigrationCount === 1
                  ? 'despesa salva'
                  : 'despesas salvas'}{' '}
                neste navegador
              </h2>
              <p className="text-xs text-emerald-200/80 mt-1">
                Envie seus registros antigos para a sua conta @{username} para acessá-los de qualquer dispositivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleLocalMigration}
            className="min-h-[40px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-[#04130D] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {busyAction === 'local' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <HardDriveUpload className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Importar para minha conta</span>
          </button>
        </section>
      )}

      {/* Monthly Goal Config */}
      <section
        aria-label="Meta mensal de gastos"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <h2 className="text-base font-semibold text-slate-100">
          Meta mensal de gastos
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Defina um teto mensal opcional para acompanhar seu progresso na barra lateral em todos os seus dispositivos.
        </p>

        <form
          onSubmit={handleSaveGoal}
          className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="sm:w-64">
            <label
              htmlFor="monthly-goal-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Valor da meta (R$)
            </label>
            <input
              id="monthly-goal-input"
              type="text"
              inputMode="decimal"
              value={goalInput}
              onChange={(e) => {
                setGoalInput(e.target.value);
                if (goalFeedback) setGoalFeedback(null);
              }}
              placeholder="Ex.: 3800,00"
              className="w-full h-11 sm:h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 text-sm text-slate-100 tabular-nums-mono placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={savingGoal}
            className="h-11 sm:h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60 text-[#04130D] text-sm font-semibold transition-all whitespace-nowrap inline-flex items-center justify-center gap-2"
          >
            {savingGoal && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>Salvar meta</span>
          </button>
        </form>

        {goalFeedback && (
          <p className="mt-2.5 text-xs text-emerald-300">{goalFeedback}</p>
        )}
      </section>

      {/* Export / Import */}
      <section
        aria-label="Exportar e importar backup"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Exportar e importar backup (.json)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Baixe uma cópia de segurança em arquivo ou importe um backup anterior direto para sua conta na nuvem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleExport}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] disabled:opacity-60 border border-white/[0.1] text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Exportar backup JSON</span>
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-60 border border-white/[0.1] text-sm font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            {busyAction === 'import' ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4 text-sky-400" aria-hidden="true" />
            )}
            <span>Importar backup JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            aria-label="Selecionar arquivo de backup JSON"
            className="hidden"
          />
        </div>

        {importStatus && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
              importStatus.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{importStatus.message}</span>
          </div>
        )}
      </section>

      {/* Reset / Clear Actions */}
      <section
        aria-label="Gerenciar dados da conta"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <h2 className="text-base font-semibold text-slate-100">
          Gerenciar dados da conta
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Limpe todos os lançamentos para começar do zero ou carregue um conjunto de demonstração para testar os gráficos.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!confirmClear ? (
            <button
              type="button"
              disabled={busyAction !== null || store.expenses.length === 0}
              onClick={() => setConfirmClear(true)}
              className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] hover:bg-rose-500/[0.15] disabled:opacity-50 text-xs font-medium text-rose-200 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Limpar todos os dados</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
              <span className="text-xs text-rose-200">
                Apagar todas as {store.expenses.length} despesas da sua conta?
              </span>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={handleClearConfirm}
                className="px-3 py-1.5 rounded-md bg-rose-500 text-white text-xs font-semibold hover:bg-rose-400 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5"
              >
                {busyAction === 'clear' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>Confirmar limpeza</span>
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-slate-100"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleRestoreDemoClick}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] disabled:opacity-60 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap"
          >
            {busyAction === 'demo' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Carregar dados de exemplo</span>
          </button>
        </div>
      </section>
    </div>
  );
}
