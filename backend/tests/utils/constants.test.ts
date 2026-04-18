import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PROSPECT_STATES,
  PRIORITIES,
  TEMPERATURES,
  TARIFAS,
  CATEGORIAS,
  CONTACT_TYPES,
  CONTACT_RESULTS,
  SOURCES,
} from '../../src/utils/constants';

describe('Constants', () => {
  describe('ROLES', () => {
    it('defines all three roles', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.COMERCIAL).toBe('comercial');
      expect(ROLES.SUPERVISOR).toBe('supervisor');
    });
  });

  describe('PROSPECT_STATES', () => {
    it('contains expected states', () => {
      expect(PROSPECT_STATES).toContain('pendiente');
      expect(PROSPECT_STATES).toContain('contrato_firmado');
      expect(PROSPECT_STATES).toContain('rechazado');
    });

    it('has no duplicate values', () => {
      const unique = new Set(PROSPECT_STATES);
      expect(unique.size).toBe(PROSPECT_STATES.length);
    });
  });

  describe('PRIORITIES', () => {
    it('has alta, media, baja', () => {
      expect(PRIORITIES).toEqual(['alta', 'media', 'baja']);
    });
  });

  describe('TEMPERATURES', () => {
    it('has frio, tibio, caliente', () => {
      expect(TEMPERATURES).toEqual(['frio', 'tibio', 'caliente']);
    });
  });

  describe('TARIFAS', () => {
    it('includes standard tariffs', () => {
      expect(TARIFAS).toContain('2.0TD');
      expect(TARIFAS).toContain('3.0TD');
      expect(TARIFAS).toContain('6.1TD');
    });
  });

  describe('CATEGORIAS', () => {
    it('includes common business categories', () => {
      expect(CATEGORIAS).toContain('restaurante');
      expect(CATEGORIAS).toContain('hotel');
      expect(CATEGORIAS).toContain('otro');
    });

    it('has no duplicates', () => {
      const unique = new Set(CATEGORIAS);
      expect(unique.size).toBe(CATEGORIAS.length);
    });
  });

  describe('CONTACT_TYPES', () => {
    it('includes call and visit types', () => {
      expect(CONTACT_TYPES).toContain('llamada');
      expect(CONTACT_TYPES).toContain('visita_presencial');
      expect(CONTACT_TYPES).toContain('email_enviado');
    });
  });

  describe('CONTACT_RESULTS', () => {
    it('includes all result types', () => {
      expect(CONTACT_RESULTS).toContain('positivo');
      expect(CONTACT_RESULTS).toContain('negativo');
      expect(CONTACT_RESULTS).toContain('no_contesto');
    });
  });

  describe('SOURCES', () => {
    it('includes all lead sources', () => {
      expect(SOURCES).toEqual(['manual', 'csv_importado', 'google_places', 'referido']);
    });
  });
});
