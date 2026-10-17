import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('retorna o status da aplicação', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.status).toBe('ok');
    expect(typeof res.body.dados.timestamp).toBe('string');
  });

  it('inclui cabeçalho de correlação x-request-id', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});

describe('rota inexistente', () => {
  it('retorna 404 no formato padronizado', async () => {
    const res = await request(app).get('/api/rota-inexistente');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      sucesso: false,
      mensagem: 'Recurso não encontrado.',
      codigo: 'NAO_ENCONTRADO',
    });
  });
});

describe('cabeçalhos de segurança', () => {
  it('aplica headers do helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
