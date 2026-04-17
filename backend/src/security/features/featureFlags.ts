/**
 * Feature flags seguros
 * NUNCA deben permitir bypasses en producción
 * Cada flag tiene validaciones explícitas
 */

import { env } from '../../config/env';

/**
 * Interface de feature flags
 */
export interface FeatureFlags {
  // Modo de desarrollo PELIGROSO - solo local
  DEV_AUTO_APPROVE: boolean;
  DEV_BYPASS_AUTH: boolean;
  DEV_SKIP_MFA: boolean;

  // Feature flags normales
  BREAK_GLASS_ENABLED: boolean;
  MFA_REQUIRED_FOR_SUPER_ADMIN: boolean;
  STRICT_PERMISSION_MODE: boolean;
  AUDIT_LOG_ALL_ACTIONS: boolean;

  // Experimentos
  NEW_DASHBOARD_UI: boolean;
  AI_AGENTS_ENABLED: boolean;
}

/**
 * Valores por defecto (SEGURO)
 * Todo comienza como deshabilitado en producción
 */
const DEFAULT_FLAGS: FeatureFlags = {
  // Development flags: solo en local
  DEV_AUTO_APPROVE: false,
  DEV_BYPASS_AUTH: false,
  DEV_SKIP_MFA: false,

  // Seguridad: habilitado por defecto
  BREAK_GLASS_ENABLED: true,
  MFA_REQUIRED_FOR_SUPER_ADMIN: true,
  STRICT_PERMISSION_MODE: true,
  AUDIT_LOG_ALL_ACTIONS: true,

  // Experimentos: deshabilitado por defecto
  NEW_DASHBOARD_UI: false,
  AI_AGENTS_ENABLED: false,
};

/**
 * Obtiene feature flags con validaciones
 */
export function getFeatureFlags(): FeatureFlags {
  const flags = { ...DEFAULT_FLAGS };

  // ⚠️ VALIDACIÓN CRÍTICA: Never allow dev flags in production
  if (env.NODE_ENV === 'production') {
    if (
      process.env.DEV_AUTO_APPROVE === 'true' ||
      process.env.DEV_BYPASS_AUTH === 'true' ||
      process.env.DEV_SKIP_MFA === 'true'
    ) {
      console.error(
        '🚨 CRITICAL: Development bypass flags detected in production! Exiting.'
      );
      process.exit(1);
    }

    // Force production safety flags
    flags.STRICT_PERMISSION_MODE = true;
    flags.MFA_REQUIRED_FOR_SUPER_ADMIN = true;
    flags.AUDIT_LOG_ALL_ACTIONS = true;

    return flags;
  }

  // En development, solo si explícitamente habilitado
  if (env.NODE_ENV === 'development') {
    flags.DEV_AUTO_APPROVE = process.env.DEV_AUTO_APPROVE === 'true';
    flags.DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === 'true';
    flags.DEV_SKIP_MFA = process.env.DEV_SKIP_MFA === 'true';

    // Pero aún requiere explícita habilitación
    if (!process.env.ENABLE_DEV_FLAGS) {
      flags.DEV_AUTO_APPROVE = false;
      flags.DEV_BYPASS_AUTH = false;
      flags.DEV_SKIP_MFA = false;
    }
  }

  // Otros flags
  flags.BREAK_GLASS_ENABLED = process.env.BREAK_GLASS_ENABLED !== 'false';
  flags.MFA_REQUIRED_FOR_SUPER_ADMIN =
    process.env.MFA_REQUIRED_FOR_SUPER_ADMIN !== 'false';
  flags.STRICT_PERMISSION_MODE =
    process.env.STRICT_PERMISSION_MODE !== 'false';
  flags.AUDIT_LOG_ALL_ACTIONS =
    process.env.AUDIT_LOG_ALL_ACTIONS !== 'false';

  // Experimentos
  flags.NEW_DASHBOARD_UI = process.env.NEW_DASHBOARD_UI === 'true';
  flags.AI_AGENTS_ENABLED = process.env.AI_AGENTS_ENABLED === 'true';

  return flags;
}

/**
 * Valida que un dev flag está habilitado
 * Lanza excepción en producción
 */
export function requireDevFlag(flag: keyof FeatureFlags): void {
  const flags = getFeatureFlags();

  if (env.NODE_ENV === 'production') {
    throw new Error(`Dev flag '${flag}' cannot be used in production`);
  }

  if (!flags[flag]) {
    throw new Error(`Dev flag '${flag}' is not enabled`);
  }
}

/**
 * Valida que un flag está habilitado
 * Retorna boolean, no lanza
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flag];
}

/**
 * Singleton de feature flags
 * Almacena en caché durante la vida del proceso
 */
let cachedFlags: FeatureFlags | null = null;

export function getFlagscached(): FeatureFlags {
  if (!cachedFlags) {
    cachedFlags = getFeatureFlags();
  }
  return cachedFlags;
}

/**
 * Valida configuración de seguridad en startup
 */
export function validateSecurityFlags(): void {
  const flags = getFeatureFlags();

  if (env.NODE_ENV === 'production') {
    // Forzar flags de seguridad en producción
    if (!flags.STRICT_PERMISSION_MODE) {
      console.warn('⚠️  WARNING: STRICT_PERMISSION_MODE disabled in production');
    }
    if (!flags.AUDIT_LOG_ALL_ACTIONS) {
      console.warn('⚠️  WARNING: AUDIT_LOG_ALL_ACTIONS disabled in production');
    }
  }

  console.info('✅ Security feature flags validated');
}
