import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDisplayUsername,
  mapFirebaseAuthError,
  normalizeUsername,
  usernameToAuthEmail,
  validateRegistrationFields,
  validateUsername,
} from './authHelpers';

describe('authHelpers', () => {
  it('normalizes usernames by trimming, removing leading @, and lowercasing', () => {
    assert.equal(normalizeUsername('  @Guilherme.Dev  '), 'guilherme.dev');
    assert.equal(normalizeUsername('@@Maria_123'), 'maria_123');
  });

  it('validates clean usernames and standard emails', () => {
    assert.equal(validateUsername('guilherme').valid, true);
    assert.equal(validateUsername('joao.silva_99').valid, true);
    assert.equal(validateUsername('ana@gmail.com').valid, true);

    assert.equal(validateUsername('ab').valid, false);
    assert.equal(validateUsername('com espaco').valid, false);
    assert.equal(validateUsername('invalido@').valid, false);
  });

  it('maps plain usernames to synthetic @orby.local email while keeping real emails intact', () => {
    assert.equal(usernameToAuthEmail('Guilherme'), 'guilherme@orby.local');
    assert.equal(usernameToAuthEmail('@ana_silva'), 'ana_silva@orby.local');
    assert.equal(usernameToAuthEmail('joao@gmail.com'), 'joao@gmail.com');
  });

  it('extracts friendly display usernames from synthetic or Google accounts', () => {
    assert.equal(
      extractDisplayUsername('guilherme@orby.local', null),
      'guilherme'
    );
    assert.equal(
      extractDisplayUsername('guilherme@gmail.com', 'Guilherme Silva'),
      'Guilherme Silva'
    );
    assert.equal(extractDisplayUsername('maria@gmail.com', null), 'maria');
  });

  it('enforces registration password length and confirmation match', () => {
    assert.equal(
      validateRegistrationFields('guilherme', '123456', '123456'),
      null
    );
    assert.match(
      validateRegistrationFields('guilherme', '12345', '12345') ?? '',
      /6 caracteres/
    );
    assert.match(
      validateRegistrationFields('guilherme', '123456', '654321') ?? '',
      /não conferem/
    );
  });

  it('maps Firebase auth error codes to clear PT-BR messages', () => {
    const exists = mapFirebaseAuthError({ code: 'auth/email-already-in-use' });
    assert.match(exists.message, /já está cadastrado/);

    const badCred = mapFirebaseAuthError({ code: 'auth/invalid-credential' });
    assert.match(badCred.message, /Usuário ou senha incorretos/);

    const disabled = mapFirebaseAuthError({ code: 'auth/operation-not-allowed' });
    assert.equal(disabled.needsEmailPasswordSetup, true);

    const domain = mapFirebaseAuthError({ code: 'auth/unauthorized-domain' });
    assert.equal(domain.needsAuthorizedDomain, true);
  });
});
