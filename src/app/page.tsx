'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/presentation/layouts/DashboardHeader';
import { useTenant } from '@/application/tenants/TenantContext';
import { TenantTierBadge } from '@/presentation/components/tenants/TenantTierBadge';
import { TenantAvatar } from '@/presentation/components/tenants/TenantAvatar';
import { ChatConsole } from '@/presentation/components/chat/ChatConsole';
import { OutboxWorkerMonitorPanel } from '@/presentation/components/outbox/OutboxWorkerMonitorPanel';
import { GovernanceDashboardPanel } from '@/presentation/components/governance/GovernanceDashboardPanel';
import { ApprovalsInboxPanel } from '@/presentation/components/approvals/ApprovalsInboxPanel';
import { KnowledgePanel } from '@/presentation/components/knowledge/KnowledgePanel';
import { StreamingMonitorPanel } from '@/presentation/components/streaming/StreamingMonitorPanel';
import { WorkflowsDashboardPanel } from '@/presentation/components/workflows/WorkflowsDashboardPanel';
import {
  Activity,
  MessageSquare,
  ShieldCheck,
  Cpu,
  Coffee,
  ShoppingCart,
  CreditCard,
  Truck,
  Headphones,
  FileText,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

interface ModuleCardProps {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'next' | 'planned';
  bgClass: string;
}

const USE_CASES: ModuleCardProps[] = [
  {
    id: 'cu-01',
    code: 'CU-01',
    title: 'Monitor de Salud y Diagnóstico',
    description: 'Verificación continua de disponibilidad de API, SQL Server y RabbitMQ.',
    icon: <Activity className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-emerald-200',
  },
  {
    id: 'cu-02',
    code: 'CU-02',
    title: 'Contexto & Aislamiento Multi-Tenant',
    description: 'Selector corporativo, inyección de X-Tenant-Id y guardia de conmutación.',
    icon: <ShieldAlert className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-amber-200',
  },
  {
    id: 'cu-03',
    code: 'CU-03',
    title: 'Consola Conversacional & Idempotencia',
    description: 'Chat interactivo con protección X-Idempotency-Key y bloqueo de doble submit.',
    icon: <MessageSquare className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-sky-200',
  },
  {
    id: 'cu-04',
    code: 'CU-04',
    title: 'Monitor Outbox Worker & Broker',
    description: 'Supervisión en tiempo real del relay asíncrono y métricas de publicación de eventos.',
    icon: <Cpu className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-purple-200',
  },
  {
    id: 'cu-05',
    code: 'CU-05',
    title: 'Dashboard de Cuotas & Presupuestos',
    description: 'Gestión de límites de gasto en USD, consumo de tokens y políticas por tenant.',
    icon: <CreditCard className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-rose-200',
  },
  {
    id: 'cu-06',
    code: 'CU-06',
    title: 'Aprobaciones Human-in-the-Loop',
    description: 'Bandeja de decisiones para acciones sensibles, tool-calling y órdenes de alto valor.',
    icon: <ShieldCheck className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-teal-200',
  },
  {
    id: 'cu-07',
    code: 'CU-07',
    title: 'Ingesta de Documentos & RAG Híbrido',
    description: 'Exploración de catálogo, embeddings y recuperación con citaciones verificadas.',
    icon: <Coffee className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-yellow-200',
  },
  {
    id: 'cu-08',
    code: 'CU-08',
    title: 'Streaming Resiliente en Vivo (SSE)',
    description: 'Streaming token-by-token de respuestas LLM con recuperación de desconexiones.',
    icon: <Truck className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-indigo-200',
  },
  {
    id: 'cu-09',
    code: 'CU-09',
    title: 'Grafo de Workflows Multi-Agente',
    description: 'Visualización de estados, checkpoints y toma de decisiones de agentes LangGraph.',
    icon: <Headphones className="w-6 h-6 stroke-[2.5]" />,
    status: 'active',
    bgClass: 'bg-orange-200',
  },
  {
    id: 'cu-10',
    code: 'CU-10',
    title: 'Auditoría & Observabilidad de Guardrails',
    description: 'Trazas de auditoría estructuradas, inspección de payloads y análisis de seguridad.',
    icon: <FileText className="w-6 h-6 stroke-[2.5]" />,
    status: 'planned',
    bgClass: 'bg-zinc-200',
  },
];

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { activeTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'modules' | 'chat' | 'outbox' | 'governance' | 'approvals' | 'knowledge' | 'streaming' | 'workflows'>('workflows');

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF8]">
      <DashboardHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-neo-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300 border-l-4 border-b-4 border-black -mr-10 -mt-10 rotate-12 -z-0 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-black text-amber-300 font-mono text-xs font-black uppercase tracking-wider">
                Clean Architecture • Neubrutalism 3D
              </span>
              {activeTenant && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200 border-2 border-black font-mono text-xs font-black shadow-neo-xs">
                  <TenantAvatar tenant={activeTenant} size="sm" />
                  <span className="truncate max-w-[150px]">{activeTenant.name}</span>
                  <TenantTierBadge tier={activeTenant.tier} />
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black">
              Portal de Operaciones & Pruebas
            </h1>

            <p className="text-base sm:text-lg text-black/80 font-medium leading-relaxed">
              Consola interactiva para el sistema conversacional corporativo de cafetería. Diseñado
              para validar de extremo a extremo los 10 casos de uso del motor, tanto en modo
              desacoplado (In-Memory Mocks) como contra la API FastAPI en producción.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={`${apiUrl}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-300 text-black font-black uppercase text-sm border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Swagger API Docs
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
              <a
                href={`${apiUrl}/redoc`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-200 text-black font-black uppercase text-sm border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                ReDoc Specification
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap gap-3 border-b-4 border-black pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-sky-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> CU-03: Consola de Chat & Idempotencia
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outbox')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'outbox'
                ? 'bg-purple-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4" /> CU-04: Monitor Outbox & Broker
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'governance'
                ? 'bg-rose-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> CU-05: Cuotas & Presupuestos
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-teal-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> CU-06: Aprobaciones HITL
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-yellow-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Coffee className="w-4 h-4" /> CU-07: Ingesta & RAG Híbrido
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('streaming')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'streaming'
                ? 'bg-indigo-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4" /> CU-08: Streaming en Vivo (SSE)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workflows')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'workflows'
                ? 'bg-orange-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Headphones className="w-4 h-4" /> CU-09: Workflows Multi-Agente
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-amber-300 text-black shadow-neo -translate-y-1'
                : 'bg-white text-zinc-700 shadow-neo-xs hover:bg-zinc-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Matriz de Casos de Uso (10 Módulos)
            </span>
          </button>
        </div>

        {/* Tab 1: Live Interactive Chat Console */}
        {activeTab === 'chat' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-black">
                  Consola Conversacional en Vivo
                </h2>
                <p className="text-xs font-mono text-zinc-600 font-bold mt-0.5">
                  Protección contra dobles envíos y deduplicación garantizada mediante UUIDv4
                </p>
              </div>
              <span className="px-2.5 py-1 font-mono text-xs font-black bg-emerald-300 text-black border-2 border-black shadow-neo-xs">
                CU-03 VALIDADO
              </span>
            </div>

            <ChatConsole conversationId="conv-cloud-1" />
          </section>
        )}

        {/* Tab 2: Outbox Worker & Broker Monitor */}
        {activeTab === 'outbox' && (
          <section className="space-y-4">
            <OutboxWorkerMonitorPanel />
          </section>
        )}

        {/* Tab 3: Governance Dashboard Panel */}
        {activeTab === 'governance' && (
          <section className="space-y-4">
            <GovernanceDashboardPanel />
          </section>
        )}

        {/* Tab 4: HITL Approvals Center Panel */}
        {activeTab === 'approvals' && (
          <section className="space-y-4">
            <ApprovalsInboxPanel />
          </section>
        )}

        {/* Tab 5: Hybrid RAG & Knowledge Base Manager */}
        {activeTab === 'knowledge' && (
          <section className="space-y-4">
            <KnowledgePanel />
          </section>
        )}

        {/* Tab 6: Resilient Real-Time SSE Streaming */}
        {activeTab === 'streaming' && (
          <section className="space-y-4">
            <StreamingMonitorPanel />
          </section>
        )}

        {/* Tab 7: Multi-Agent Workflow State Graph */}
        {activeTab === 'workflows' && (
          <section className="space-y-4">
            <WorkflowsDashboardPanel />
          </section>
        )}

        {/* Tab 7: 10 Modules Grid */}
        {activeTab === 'modules' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-wider text-black">
                Módulos y Casos de Uso
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-1 bg-black text-white">
                10 CASOS DEFINIDOS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.id}
                  className={`border-4 border-black p-5 shadow-neo transition-all flex flex-col justify-between ${
                    uc.bgClass
                  } ${uc.status === 'active' ? 'hover:-translate-y-1 hover:shadow-neo-lg' : ''}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 font-mono text-xs font-black bg-black text-white uppercase">
                        {uc.code}
                      </span>
                      {uc.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-400 text-black text-xs font-black uppercase border border-black">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validado
                        </span>
                      ) : uc.status === 'next' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-black text-xs font-black uppercase border border-black animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Siguiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-300 text-zinc-800 text-xs font-bold uppercase border border-black">
                          Planificado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="p-2 bg-white border-2 border-black shadow-neo-sm shrink-0">
                        {uc.icon}
                      </div>
                      <h3 className="font-black text-lg text-black leading-tight">{uc.title}</h3>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-black/85 leading-relaxed">
                      {uc.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t-2 border-black/30 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-black/70 uppercase">
                      {uc.status === 'active' ? 'Totalmente Operativo' : 'Roadmap v1.0'}
                    </span>
                    {uc.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (uc.id === 'cu-03') setActiveTab('chat');
                          if (uc.id === 'cu-04') setActiveTab('outbox');
                          if (uc.id === 'cu-05') setActiveTab('governance');
                          if (uc.id === 'cu-06') setActiveTab('approvals');
                          if (uc.id === 'cu-07') setActiveTab('knowledge');
                          if (uc.id === 'cu-08') setActiveTab('streaming');
                          if (uc.id === 'cu-09') setActiveTab('workflows');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase text-black group cursor-pointer hover:underline"
                      >
                        Acceder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white p-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold text-black">
          <p>© 2026 AngelSolutions • AI Conversation Platform</p>
          <div className="flex items-center gap-4">
            <span>Clean Architecture Frontend</span>
            <span>•</span>
            <span>TypeScript & Next.js 14</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
