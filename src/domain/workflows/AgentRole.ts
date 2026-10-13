export type AgentRole = 'supervisor' | 'researcher' | 'auditor' | 'synthesizer';

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  supervisor: '#8B5CF6',
  researcher: '#3B82F6',
  auditor: '#FBBF24',
  synthesizer: '#10B981',
};

export const AGENT_ROLE_NAMES: Record<AgentRole, string> = {
  supervisor: 'Supervisor Orquestador',
  researcher: 'Investigador RAG',
  auditor: 'Auditor HITL Guard',
  synthesizer: 'Sintetizador Ejecutivo',
};
