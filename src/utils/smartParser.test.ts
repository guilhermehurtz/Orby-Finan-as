import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSmartExpenseInput } from './smartParser';

const REF_DATE = new Date(2026, 10, 23, 12, 0, 0); // 2026-11-23

test('parses classic "35 almoço pix" input cleanly', () => {
  const res = parseSmartExpenseInput('35 almoço pix', '2026-11', REF_DATE);
  assert.equal(res.valid, true);
  assert.equal(res.amount, 35);
  assert.equal(res.name, 'Almoço');
  assert.equal(res.category, 'alimentacao');
  assert.equal(res.paymentMethod, 'pix');
  assert.equal(res.paymentDetected, true);
  assert.equal(res.type, 'variavel');
  assert.equal(res.day, 23);
  assert.equal(res.month, '2026-11');
});

test('parses credit card, comma decimals, and fixed type', () => {
  const res = parseSmartExpenseInput(
    '129,90 academia crédito fixa',
    '2026-11',
    REF_DATE
  );
  assert.equal(res.valid, true);
  assert.equal(res.amount, 129.9);
  assert.equal(res.name, 'Academia');
  assert.equal(res.category, 'saude');
  assert.equal(res.paymentMethod, 'credito');
  assert.equal(res.type, 'fixa');
  assert.equal(res.typeDetected, true);
});

test('distinguishes débito from crédito and parses "ontem"', () => {
  const res = parseSmartExpenseInput(
    'uber 42,50 no débito ontem',
    '2026-11',
    REF_DATE
  );
  assert.equal(res.valid, true);
  assert.equal(res.amount, 42.5);
  assert.equal(res.name, 'Uber');
  assert.equal(res.category, 'transporte');
  assert.equal(res.paymentMethod, 'debito');
  assert.equal(res.day, 22);
  assert.equal(res.dateDetected, true);
});

test('parses dinheiro vivo and explicit "dia 10" without confusing day with amount', () => {
  const res = parseSmartExpenseInput(
    'R$ 180 luz dia 10 dinheiro vivo',
    '2026-11',
    REF_DATE
  );
  assert.equal(res.valid, true);
  assert.equal(res.amount, 180);
  assert.equal(res.name, 'Luz');
  assert.equal(res.category, 'contas');
  assert.equal(res.paymentMethod, 'dinheiro');
  assert.equal(res.type, 'fixa'); // inferred from "luz"
  assert.equal(res.day, 10);
});

test('parses explicit DD/MM date and switches target month when given', () => {
  const res = parseSmartExpenseInput(
    'supermercado 250,00 15/10 cartao debito',
    '2026-11',
    REF_DATE
  );
  assert.equal(res.valid, true);
  assert.equal(res.amount, 250);
  assert.equal(res.name, 'Supermercado');
  assert.equal(res.category, 'alimentacao');
  assert.equal(res.paymentMethod, 'debito');
  assert.equal(res.day, 15);
  assert.equal(res.month, '2026-10');
});

test('handles month rollover when "ontem" is used on the 1st of the month', () => {
  const firstOfMonth = new Date(2026, 10, 1, 10, 0, 0); // 2026-11-01
  const res = parseSmartExpenseInput('20 café ontem pix', '2026-11', firstOfMonth);
  assert.equal(res.valid, true);
  assert.equal(res.day, 31);
  assert.equal(res.month, '2026-10');
});

test('rejects incomplete inputs without fabricating amount or name', () => {
  const noAmount = parseSmartExpenseInput('almoço pix', '2026-11', REF_DATE);
  assert.equal(noAmount.valid, false);
  assert.equal(noAmount.amount, null);

  const noName = parseSmartExpenseInput('35 pix', '2026-11', REF_DATE);
  assert.equal(noName.valid, false);
  assert.equal(noName.name, '');
});
