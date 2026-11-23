import {
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
} from '../types/finance';
import { getCurrentMonthKey, parseBRLInput } from './finance';

export interface SmartParsedExpense {
  raw: string;
  valid: boolean;
  error: string | null;
  name: string;
  amount: number | null;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentDetected: boolean;
  type: ExpenseType;
  typeDetected: boolean;
  day: number;
  month: string;
  dateDetected: boolean;
}

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  moradia: [
    'aluguel',
    'condominio',
    'iptu',
    'apartamento',
    'moradia',
    'moveis',
    'reforma',
    'imobiliaria',
    'diarista',
    'faxina',
  ],
  alimentacao: [
    'almoco',
    'jantar',
    'cafe',
    'padaria',
    'mercado',
    'supermercado',
    'hortifruti',
    'feira',
    'ifood',
    'delivery',
    'lanche',
    'pizza',
    'hamburguer',
    'burger',
    'restaurante',
    'acougue',
    'marmita',
    'sushi',
    'sorvete',
    'acai',
    'pastel',
    'salgado',
    'comida',
    'bebida',
    'agua mineral',
    'pao',
    'chocolate',
    'doceria',
  ],
  contas: [
    'luz',
    'energia',
    'eletrica',
    'agua',
    'saneamento',
    'gas',
    'internet',
    'fibra',
    'wifi',
    'celular',
    'telefone',
    'claro',
    'vivo',
    'tim',
    'boleto',
    'fatura',
    'taxa',
  ],
  transporte: [
    'uber',
    '99',
    'taxi',
    'gasolina',
    'combustivel',
    'etanol',
    'diesel',
    'posto',
    'onibus',
    'metro',
    'trem',
    'passagem',
    'estacionamento',
    'pedagio',
    'mecanico',
    'oficina',
    'pneu',
    'ipva',
    'seguro auto',
    'lavajato',
  ],
  saude: [
    'farmacia',
    'remedio',
    'medicamento',
    'medico',
    'consulta',
    'exame',
    'dentista',
    'academia',
    'smartfit',
    'smart',
    'psicologo',
    'terapia',
    'plano de saude',
    'unimed',
    'hospital',
    'suplemento',
    'whey',
    'creatina',
    'pilates',
  ],
  assinaturas: [
    'netflix',
    'spotify',
    'prime',
    'amazon prime',
    'disney',
    'hbo',
    'max',
    'youtube',
    'icloud',
    'google one',
    'chatgpt',
    'assinatura',
    'streaming',
    'gamepass',
    'playstation',
    'xbox',
    'canva',
    'clube',
  ],
  lazer: [
    'cinema',
    'show',
    'teatro',
    'viagem',
    'hotel',
    'airbnb',
    'bar',
    'balada',
    'festa',
    'ingresso',
    'jogo',
    'passeio',
    'parque',
    'presente',
    'shopping',
    'roupa',
    'tenis',
    'livro',
    'cerveja',
    'chopp',
  ],
  outros: [],
};

const FIXED_INFERENCE_KEYWORDS = [
  'aluguel',
  'condominio',
  'internet',
  'fibra',
  'energia',
  'luz',
  'agua',
  'plano de saude',
  'academia',
  'netflix',
  'spotify',
  'icloud',
  'assinatura',
  'streaming',
  'celular',
  'seguro',
];

function detectCategory(normalizedName: string): ExpenseCategory {
  const padded = ` ${normalizedName} `;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ExpenseCategory,
    string[],
  ][]) {
    if (category === 'outros') continue;
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        if (padded.includes(` ${kw} `)) return category;
      } else {
        const regex = new RegExp(`(^|\\s)${kw}(s)?($|\\s)`, 'i');
        if (regex.test(normalizedName)) return category;
      }
    }
  }
  return 'outros';
}

function inferFixedFromName(normalizedName: string): boolean {
  for (const kw of FIXED_INFERENCE_KEYWORDS) {
    if (normalizedName.includes(kw)) return true;
  }
  return false;
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Pure, client-side natural language expense parser for Brazilian Portuguese.
 * Examples:
 *  - "35 almoço pix"
 *  - "129,90 academia crédito fixa"
 *  - "42,50 uber ontem débito"
 *  - "R$ 180 luz dia 10 dinheiro"
 */
export function parseSmartExpenseInput(
  rawInput: string,
  activeMonth: string,
  referenceDate: Date = new Date()
): SmartParsedExpense {
  const raw = rawInput.trim();
  const defaultDay = referenceDate.getDate();

  if (!raw) {
    return {
      raw,
      valid: false,
      error: 'Digite uma despesa (ex.: 35 almoço pix).',
      name: '',
      amount: null,
      category: 'outros',
      paymentMethod: 'pix',
      paymentDetected: false,
      type: 'variavel',
      typeDetected: false,
      day: defaultDay,
      month: activeMonth,
      dateDetected: false,
    };
  }

  let working = raw;

  // 1. Extract explicit date expressions BEFORE extracting numeric amount
  //    so "dia 10" or "15/11" is never mistaken for the R$ value.
  let day = defaultDay;
  let month = activeMonth;
  let dateDetected = false;

  // Match DD/MM or DD/MM/YYYY
  const slashDateMatch = working.match(
    /(?:^|\s)(?:em\s+|no\s+dia\s+|dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/i
  );
  if (slashDateMatch) {
    const d = Number(slashDateMatch[1]);
    const m = Number(slashDateMatch[2]);
    const yRaw = slashDateMatch[3];
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      day = d;
      const year = yRaw
        ? yRaw.length === 2
          ? 2000 + Number(yRaw)
          : Number(yRaw)
        : Number(activeMonth.split('-')[0]) || referenceDate.getFullYear();
      month = `${year}-${String(m).padStart(2, '0')}`;
      dateDetected = true;
      working = working.replace(slashDateMatch[0], ' ');
    }
  }

  // Match "dia 10" / "no dia 10"
  if (!dateDetected) {
    const diaMatch = working.match(/(?:^|\s)(?:no\s+)?dia\s+(\d{1,2})(?=\s|$)/i);
    if (diaMatch) {
      const d = Number(diaMatch[1]);
      if (d >= 1 && d <= 31) {
        day = d;
        dateDetected = true;
        working = working.replace(diaMatch[0], ' ');
      }
    }
  }

  // Match "anteontem" / "ontem" / "hoje"
  if (!dateDetected) {
    const normWorking = normalizeText(working);
    if (/(?:^|\s)anteontem(?=\s|$)/.test(normWorking)) {
      const target = new Date(referenceDate);
      target.setDate(target.getDate() - 2);
      day = target.getDate();
      month = getCurrentMonthKey(target);
      dateDetected = true;
      working = working.replace(/(?:^|\s)anteontem(?=\s|$)/i, ' ');
    } else if (/(?:^|\s)ontem(?=\s|$)/.test(normWorking)) {
      const target = new Date(referenceDate);
      target.setDate(target.getDate() - 1);
      day = target.getDate();
      month = getCurrentMonthKey(target);
      dateDetected = true;
      working = working.replace(/(?:^|\s)ontem(?=\s|$)/i, ' ');
    } else if (/(?:^|\s)hoje(?=\s|$)/.test(normWorking)) {
      day = referenceDate.getDate();
      month = getCurrentMonthKey(referenceDate);
      dateDetected = true;
      working = working.replace(/(?:^|\s)hoje(?=\s|$)/i, ' ');
    }
  }

  // 2. Extract Payment Method (Pix, Crédito, Débito, Dinheiro)
  let paymentMethod: PaymentMethod = 'pix';
  let paymentDetected = false;

  const paymentPatterns: Array<{ method: PaymentMethod; regex: RegExp }> = [
    {
      method: 'debito',
      regex:
        /(?:^|\s)(?:no\s+|na\s+|em\s+|via\s+|pelo\s+|com\s+)?(?:cart[aã]o\s+(?:de\s+)?)?d[eé]bito(?=\s|$)/i,
    },
    {
      method: 'credito',
      regex:
        /(?:^|\s)(?:no\s+|na\s+|em\s+|via\s+|pelo\s+|com\s+)?(?:cart[aã]o\s+(?:de\s+)?)?cr[eé]dito(?=\s|$)/i,
    },
    {
      method: 'credito',
      regex:
        /(?:^|\s)(?:no\s+|na\s+|em\s+|via\s+|pelo\s+|com\s+)?(?:cart[aã]o|cc)(?=\s|$)/i,
    },
    {
      method: 'pix',
      regex: /(?:^|\s)(?:no\s+|na\s+|em\s+|via\s+|pelo\s+|com\s+)?pix(?=\s|$)/i,
    },
    {
      method: 'dinheiro',
      regex:
        /(?:^|\s)(?:no\s+|na\s+|em\s+|via\s+|pelo\s+|com\s+)?(?:dinheiro(?:\s+vivo)?|esp[eé]cie|cash)(?=\s|$)/i,
    },
  ];

  for (const pattern of paymentPatterns) {
    const match = working.match(pattern.regex);
    if (match) {
      paymentMethod = pattern.method;
      paymentDetected = true;
      working = working.replace(match[0], ' ');
      break;
    }
  }

  // 3. Extract Expense Type (Fixa / Variável)
  let type: ExpenseType = 'variavel';
  let typeDetected = false;

  const fixedMatch = working.match(
    /(?:^|\s)(?:despesa\s+)?(?:fixa|fixo|mensal|recorrente)(?=\s|$)/i
  );
  if (fixedMatch) {
    type = 'fixa';
    typeDetected = true;
    working = working.replace(fixedMatch[0], ' ');
  } else {
    const varMatch = working.match(
      /(?:^|\s)(?:despesa\s+)?(?:vari[aá]vel|avulsa|avulso)(?=\s|$)/i
    );
    if (varMatch) {
      type = 'variavel';
      typeDetected = true;
      working = working.replace(varMatch[0], ' ');
    }
  }

  // 4. Extract Monetary Amount (supports "R$ 35", "35", "129,90", "1.250,00", "42.50")
  let amount: number | null = null;
  const amountRegex = /(?:^|\s)(?:r\$\s*)?(\d+(?:[.,]\d{1,3})*(?:[.,]\d{1,2})?)(?:\s*reais?)?(?=\s|$)/i;
  const amountMatches = Array.from(
    working.matchAll(
      /(?:^|\s)((?:r\$\s*)?\d+(?:[.,]\d{1,3})*(?:[.,]\d{1,2})?(?:\s*reais?)?)(?=\s|$)/gi
    )
  );

  // Prefer tokens with currency symbol/decimals, otherwise first standalone number (avoid stripping "99" in "99 pop" if another value exists)
  let chosenMatch: RegExpMatchArray | null = null;
  if (amountMatches.length === 1) {
    chosenMatch = amountMatches[0];
  } else if (amountMatches.length > 1) {
    chosenMatch =
      amountMatches.find((m) => /r\$|reais|[.,]/i.test(m[1])) ?? amountMatches[0];
  }

  if (chosenMatch) {
    const rawNum = chosenMatch[1].replace(/reais?/gi, '').trim();
    const parsed = parseBRLInput(rawNum);
    if (parsed !== null) {
      amount = parsed;
      working = working.replace(chosenMatch[0], ' ');
    }
  } else {
    const fallbackMatch = working.match(amountRegex);
    if (fallbackMatch) {
      const parsed = parseBRLInput(fallbackMatch[1]);
      if (parsed !== null) {
        amount = parsed;
        working = working.replace(fallbackMatch[0], ' ');
      }
    }
  }

  // 5. Clean remaining tokens into Expense Name
  let cleanedName = working
    .replace(/[-–—·,:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip dangling prepositions at edges (e.g., "de almoço no" -> "almoço")
  cleanedName = cleanedName
    .replace(/^(?:de|do|da|no|na|em|com|por|para|pra)\s+/i, '')
    .replace(/\s+(?:de|do|da|no|na|em|com|por|para|pra)$/i, '')
    .trim();

  const name = capitalizeSentence(cleanedName);
  const normalizedName = normalizeText(name);

  // 6. Infer category & fixed/variable when not explicitly stated
  const category = detectCategory(normalizedName);
  if (!typeDetected && inferFixedFromName(normalizedName)) {
    type = 'fixa';
  }

  // 7. Validate
  let error: string | null = null;
  if (amount === null) {
    error = 'Inclua o valor da despesa (ex.: 35 almoço pix).';
  } else if (!name) {
    error = 'Inclua o nome da despesa (ex.: 35 almoço pix).';
  }

  return {
    raw,
    valid: amount !== null && Boolean(name),
    error,
    name,
    amount,
    category,
    paymentMethod,
    paymentDetected,
    type,
    typeDetected,
    day,
    month,
    dateDetected,
  };
}
