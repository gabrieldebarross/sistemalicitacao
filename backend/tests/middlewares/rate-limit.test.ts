import { EventEmitter } from 'node:events';

import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { RateLimitError } from '../../src/errors/app-error.js';
import { limitarLogin } from '../../src/middlewares/rate-limit.middleware.js';

function requisitar(ip: string): { res: Response; next: ReturnType<typeof vi.fn> } {
  const req = { ip } as Request;
  const res = new EventEmitter() as Response;
  res.statusCode = 200;
  const next = vi.fn();
  limitarLogin(req, res, next as unknown as NextFunction);
  return { res, next };
}

function responder(res: Response, statusCode: number): void {
  res.statusCode = statusCode;
  res.emit('finish');
}

describe('limite de tentativas de autenticação', () => {
  it('não conta requisições bem-sucedidas', () => {
    for (let indice = 0; indice < 30; indice += 1) {
      const { res, next } = requisitar('10.0.0.1');
      responder(res, 200);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0]).toEqual([]);
    }
  });

  it('não conta erros de validação', () => {
    for (let indice = 0; indice < 30; indice += 1) {
      const { res, next } = requisitar('10.0.0.2');
      responder(res, 400);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0]).toEqual([]);
    }
  });

  it('bloqueia após 10 falhas de autenticação', () => {
    const ip = '10.0.0.3';
    for (let indice = 0; indice < 10; indice += 1) {
      const { res, next } = requisitar(ip);
      responder(res, 401);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0]).toEqual([]);
    }

    const { next } = requisitar(ip);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(RateLimitError);
  });
});
