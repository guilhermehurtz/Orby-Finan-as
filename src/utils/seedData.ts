import { Expense, FinanceStoreData } from '../types/finance';
import { getCurrentMonthKey, shiftMonth } from './finance';

export function buildInitialSeedData(referenceDate: Date = new Date()): FinanceStoreData {
  const m0 = getCurrentMonthKey(referenceDate); // Current month (e.g., 2026-11)
  const m1 = shiftMonth(m0, -1); // Previous month (e.g., 2026-10)
  const m2 = shiftMonth(m0, -2); // 2 months ago (e.g., 2026-09)
  const m3 = shiftMonth(m0, -3); // 3 months ago (e.g., 2026-08)
  const m4 = shiftMonth(m0, -4); // 4 months ago (e.g., 2026-07)
  const m5 = shiftMonth(m0, -5); // 5 months ago (e.g., 2026-06)

  const expenses: Expense[] = [
    // 5 months ago
    { id: 'seed-m5-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m5, day: 5, createdAt: '2026-06-05T10:00:00Z' },
    { id: 'seed-m5-2', name: 'Supermercado do Mês', amount: 740.0, category: 'alimentacao', type: 'variavel', month: m5, day: 9, createdAt: '2026-06-09T14:20:00Z' },
    { id: 'seed-m5-3', name: 'Energia Elétrica', amount: 186.2, category: 'contas', type: 'fixa', month: m5, day: 10, createdAt: '2026-06-10T09:15:00Z' },
    { id: 'seed-m5-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m5, day: 12, createdAt: '2026-06-12T08:00:00Z' },
    { id: 'seed-m5-5', name: 'Combustível e Apps', amount: 295.0, category: 'transporte', type: 'variavel', month: m5, day: 15, createdAt: '2026-06-15T18:00:00Z' },
    { id: 'seed-m5-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m5, day: 18, createdAt: '2026-06-18T11:00:00Z' },
    { id: 'seed-m5-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m5, day: 20, createdAt: '2026-06-20T09:00:00Z' },
    { id: 'seed-m5-8', name: 'Jantares e Cinema', amount: 240.0, category: 'lazer', type: 'variavel', month: m5, day: 25, createdAt: '2026-06-25T21:00:00Z' },

    // 4 months ago
    { id: 'seed-m4-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m4, day: 5, createdAt: '2026-07-05T10:00:00Z' },
    { id: 'seed-m4-2', name: 'Supermercado do Mês', amount: 820.5, category: 'alimentacao', type: 'variavel', month: m4, day: 8, createdAt: '2026-07-08T14:20:00Z' },
    { id: 'seed-m4-3', name: 'Energia Elétrica', amount: 205.4, category: 'contas', type: 'fixa', month: m4, day: 10, createdAt: '2026-07-10T09:15:00Z' },
    { id: 'seed-m4-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m4, day: 12, createdAt: '2026-07-12T08:00:00Z' },
    { id: 'seed-m4-5', name: 'Combustível e Apps', amount: 335.0, category: 'transporte', type: 'variavel', month: m4, day: 16, createdAt: '2026-07-16T18:00:00Z' },
    { id: 'seed-m4-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m4, day: 18, createdAt: '2026-07-18T11:00:00Z' },
    { id: 'seed-m4-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m4, day: 20, createdAt: '2026-07-20T09:00:00Z' },
    { id: 'seed-m4-8', name: 'Lazer e Viagem Curta', amount: 390.0, category: 'lazer', type: 'variavel', month: m4, day: 23, createdAt: '2026-07-23T21:00:00Z' },

    // 3 months ago
    { id: 'seed-m3-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m3, day: 5, createdAt: '2026-08-05T10:00:00Z' },
    { id: 'seed-m3-2', name: 'Supermercado do Mês', amount: 790.4, category: 'alimentacao', type: 'variavel', month: m3, day: 8, createdAt: '2026-08-08T14:20:00Z' },
    { id: 'seed-m3-3', name: 'Energia Elétrica', amount: 198.5, category: 'contas', type: 'fixa', month: m3, day: 10, createdAt: '2026-08-10T09:15:00Z' },
    { id: 'seed-m3-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m3, day: 12, createdAt: '2026-08-12T08:00:00Z' },
    { id: 'seed-m3-5', name: 'Combustível e Apps', amount: 310.0, category: 'transporte', type: 'variavel', month: m3, day: 16, createdAt: '2026-08-16T18:00:00Z' },
    { id: 'seed-m3-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m3, day: 18, createdAt: '2026-08-18T11:00:00Z' },
    { id: 'seed-m3-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m3, day: 20, createdAt: '2026-08-20T09:00:00Z' },
    { id: 'seed-m3-8', name: 'Jantares e Cinema', amount: 265.0, category: 'lazer', type: 'variavel', month: m3, day: 24, createdAt: '2026-08-24T21:00:00Z' },

    // 2 months ago
    { id: 'seed-m2-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m2, day: 5, createdAt: '2026-09-05T10:00:00Z' },
    { id: 'seed-m2-2', name: 'Supermercado do Mês', amount: 845.2, category: 'alimentacao', type: 'variavel', month: m2, day: 7, createdAt: '2026-09-07T15:30:00Z' },
    { id: 'seed-m2-3', name: 'Energia Elétrica', amount: 214.9, category: 'contas', type: 'fixa', month: m2, day: 10, createdAt: '2026-09-10T09:15:00Z' },
    { id: 'seed-m2-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m2, day: 12, createdAt: '2026-09-12T08:00:00Z' },
    { id: 'seed-m2-5', name: 'Combustível e Apps', amount: 275.5, category: 'transporte', type: 'variavel', month: m2, day: 15, createdAt: '2026-09-15T19:00:00Z' },
    { id: 'seed-m2-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m2, day: 18, createdAt: '2026-09-18T11:00:00Z' },
    { id: 'seed-m2-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m2, day: 20, createdAt: '2026-09-20T09:00:00Z' },
    { id: 'seed-m2-8', name: 'Farmácia e Exames', amount: 164.0, category: 'saude', type: 'variavel', month: m2, day: 22, createdAt: '2026-09-22T12:00:00Z' },
    { id: 'seed-m2-9', name: 'Passeio Fim de Semana', amount: 340.0, category: 'lazer', type: 'variavel', month: m2, day: 26, createdAt: '2026-09-26T20:00:00Z' },

    // Previous month (slightly higher so current month shows clear savings!)
    { id: 'seed-m1-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m1, day: 5, createdAt: '2026-10-05T10:00:00Z' },
    { id: 'seed-m1-2', name: 'Supermercado do Mês', amount: 812.6, category: 'alimentacao', type: 'variavel', month: m1, day: 9, createdAt: '2026-10-09T16:10:00Z' },
    { id: 'seed-m1-3', name: 'Energia Elétrica', amount: 228.4, category: 'contas', type: 'fixa', month: m1, day: 10, createdAt: '2026-10-10T09:15:00Z' },
    { id: 'seed-m1-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m1, day: 12, createdAt: '2026-10-12T08:00:00Z' },
    { id: 'seed-m1-5', name: 'Combustível e Apps', amount: 348.0, category: 'transporte', type: 'variavel', month: m1, day: 14, createdAt: '2026-10-14T18:30:00Z' },
    { id: 'seed-m1-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m1, day: 18, createdAt: '2026-10-18T11:00:00Z' },
    { id: 'seed-m1-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m1, day: 20, createdAt: '2026-10-20T09:00:00Z' },
    { id: 'seed-m1-8', name: 'Delivery e Cafés', amount: 215.3, category: 'alimentacao', type: 'variavel', month: m1, day: 23, createdAt: '2026-10-23T20:15:00Z' },
    { id: 'seed-m1-9', name: 'Manutenção Casa', amount: 190.0, category: 'outros', type: 'variavel', month: m1, day: 27, createdAt: '2026-10-27T15:00:00Z' },

    // Current month (controlled spending -> Economia de R$ 418,30 vs previous month)
    { id: 'seed-m0-1', name: 'Aluguel e Condomínio', amount: 1650.0, category: 'moradia', type: 'fixa', month: m0, day: 5, note: 'Pago via PIX', createdAt: '2026-11-05T10:00:00Z' },
    { id: 'seed-m0-2', name: 'Supermercado e Feira', amount: 685.5, category: 'alimentacao', type: 'variavel', month: m0, day: 8, note: 'Compra quinzenal + hortifruti', createdAt: '2026-11-08T14:00:00Z' },
    { id: 'seed-m0-3', name: 'Energia Elétrica', amount: 184.2, category: 'contas', type: 'fixa', month: m0, day: 10, createdAt: '2026-11-10T09:15:00Z' },
    { id: 'seed-m0-4', name: 'Internet Fibra', amount: 119.9, category: 'contas', type: 'fixa', month: m0, day: 12, createdAt: '2026-11-12T08:00:00Z' },
    { id: 'seed-m0-5', name: 'Combustível e Uber', amount: 242.0, category: 'transporte', type: 'variavel', month: m0, day: 14, createdAt: '2026-11-14T17:45:00Z' },
    { id: 'seed-m0-6', name: 'Plano de Saúde', amount: 280.0, category: 'saude', type: 'fixa', month: m0, day: 18, createdAt: '2026-11-18T11:00:00Z' },
    { id: 'seed-m0-7', name: 'Streaming e Música', amount: 84.8, category: 'assinaturas', type: 'fixa', month: m0, day: 20, createdAt: '2026-11-20T09:00:00Z' },
    { id: 'seed-m0-8', name: 'Restaurante e Lazer', amount: 168.3, category: 'lazer', type: 'variavel', month: m0, day: 21, createdAt: '2026-11-21T13:00:00Z' },
    { id: 'seed-m0-9', name: 'Padaria e Cafés', amount: 96.0, category: 'alimentacao', type: 'variavel', month: m0, day: 21, createdAt: '2026-11-21T15:00:00Z' },
  ];

  return {
    version: 1,
    expenses,
    monthlyGoal: 3800,
    seeded: true,
  };
}
