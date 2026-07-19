/**
 * Reglas de arquitectura (ver openspec/changes/arquitectura-frontend):
 * core/infrastructure/presentation, y solo infrastructure puede importar
 * el cliente de Supabase.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'core-no-infrastructure',
      comment: 'core (dominio + casos de uso) no debe depender de infrastructure',
      severity: 'error',
      from: { path: '^src/core' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'core-no-presentation',
      comment: 'core no debe depender de presentation (ni, por lo tanto, de React)',
      severity: 'error',
      from: { path: '^src/core' },
      to: { path: '^src/presentation' },
    },
    {
      name: 'presentation-no-infrastructure',
      comment:
        'presentation no debe importar infrastructure directamente; la composicion ' +
        '(wiring de adapters concretos) vive en src/main.tsx, fuera de presentation/',
      severity: 'error',
      from: { path: '^src/presentation' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'only-infrastructure-imports-supabase',
      comment: 'solo infrastructure puede importar el cliente de Supabase (@supabase/supabase-js)',
      severity: 'error',
      from: { path: '^src/(?!infrastructure)' },
      to: { path: 'node_modules/@supabase/supabase-js' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
}
