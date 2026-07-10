import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatConsole from './components/ChatConsole';
import { ChevronUp, ChevronDown, Compass, MessageSquare, Settings, ArrowLeft, Cpu, Save } from 'lucide-react';
import { getBackendUrl, setBackendUrl } from './utils/config';
import { getModuleById } from './utils/modules';

export default function App() {
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [triggerQueryText, setTriggerQueryText] = useState('');
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState('explorador');
  const [tempUrl, setTempUrl] = useState(getBackendUrl());
  const [activeModule, setActiveModule] = useState('estructura_rafam');

  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    if (moduleId !== 'estructura_rafam') {
      setActiveNode(null);
    }
  };

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'system',
      text: 'Consola de RAG RAFAM inicializada. Modelo activo: gemini-2.5-flash. Ingrese su consulta presupuestaria o seleccione un nodo del árbol para inyectar su contexto contable de forma automática.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      // Auto-colapsar barra lateral en pantallas estrechas o verticales (< 1024px)
      if (width < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchEstructura = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/estructura`);
      if (!response.ok) {
        throw new Error('Error al cargar la estructura.');
      }
      const data = await response.json();
      setEstructura(data);
    } catch (error) {
      console.error('Error fetching estructura:', error);
      // Fallback a un objeto de estructura básico para evitar fallos si el back-end tarda en responder
      setEstructura({
        año: 2026,
        jurisdicciones: [
          { codigo: '1110119000', nombre: 'Secretaría de Obras Públicas (Offline)' }
        ],
        programas: [
          {
            codigo: '16',
            nombre: 'Desarrollo Vial (Offline)',
            jurisdiccion_codigo: '1110119000',
            actividades: [
              { codigo: '01', nombre: 'Conservación de Caminos de Tierra' },
              { codigo: '51', nombre: 'Repavimentación Barrio Jardin' }
            ]
          }
        ],
        gastos_objeto: [
          { codigo: '1.0.0', nombre: 'Gastos en Personal' },
          { codigo: '2.0.0', text: 'Bienes de Consumo' }
        ],
        recursos_rubro: [
          { codigo: '11.2.01.12', nombre: 'Tasa por servicios rurales' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstructura();
  }, []);

  const handleSelectNode = (node) => {
    setActiveNode(node);
  };

  const handleQuickAsk = (queryText) => {
    setTriggerQueryText(queryText);
  };

  const clearTriggerQuery = () => {
    setTriggerQueryText('');
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-rafamDark-900 text-slate-100 flex flex-col selection:bg-neonBlue/30 selection:text-white antialiased overflow-hidden">
        {/* Cabecera Móvil */}
        <header className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-neonBlue" />
            <span className="text-base font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-neonBlue">
              RAG Chas
            </span>
            <span className="px-1.5 py-0.5 text-[8px] uppercase font-mono bg-neonPurple/20 text-neonPurple border border-neonPurple/30 rounded-md">
              Móvil
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span>CONECTADO</span>
          </div>
        </header>

        {/* Contenido Principal Móvil */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {mobileTab === 'explorador' && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {activeNode ? (
                // Vista de Detalles del Nodo
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className="p-3 bg-rafamDark-950/40 border-b border-white/5 flex items-center gap-2">
                    <button
                      onClick={() => setActiveNode(null)}
                      className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </button>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-xs text-slate-300 font-mono font-bold truncate">
                      {activeNode.nombre}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Dashboard 
                      activeNode={activeNode} 
                      activeModule={activeModule}
                      onQuickAsk={(queryText) => {
                        handleQuickAsk(queryText);
                        setMobileTab('chat');
                      }}
                    />
                  </div>
                </div>
              ) : (
                // Vista de Árbol Jerárquico
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    estructura={estructura}
                    loading={loading}
                    activeNode={activeNode}
                    onSelectNode={handleSelectNode}
                    collapsed={false}
                    setCollapsed={() => {}}
                    activeModule={activeModule}
                    onModuleChange={handleModuleChange}
                    onQuickAsk={(queryText) => {
                      handleQuickAsk(queryText);
                      setMobileTab('chat');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {mobileTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <ChatConsole
                activeNode={activeNode}
                triggerQueryText={triggerQueryText}
                clearTriggerQuery={clearTriggerQuery}
                dashboardCollapsed={true}
                forceFullscreen={true}
                messages={chatMessages}
                setMessages={setChatMessages}
                activeModule={activeModule}
              />
            </div>
          )}

          {mobileTab === 'ajustes' && (
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 font-mono text-xs max-w-md mx-auto w-full">
              <div className="bg-rafamDark-950/40 p-4 border border-white/10 rounded-xl flex flex-col gap-4">
                <h3 className="font-bold text-slate-200 border-b border-white/5 pb-2">Ajustes de Servidor</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Dirección IP / URL:</label>
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="bg-rafamDark-900 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neonBlue/50 transition-all text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTempUrl('http://localhost:8000')}
                    className="flex-1 py-2 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Localhost
                  </button>
                  <button
                    onClick={() => {
                      const localIP = window.prompt("Ingrese la IP local (ej. 192.168.1.50):");
                      if (localIP) setTempUrl(`http://${localIP.trim()}:8000`);
                    }}
                    className="flex-1 py-2 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    IP Local
                  </button>
                </div>

                <button
                  onClick={() => {
                    setBackendUrl(tempUrl);
                    window.location.reload();
                  }}
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-neonBlue to-neonPurple rounded-lg text-white font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs"
                >
                  <Save className="w-4 h-4" />
                  Guardar y Conectar
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Tab Bar Inferior */}
        <footer className="glass border-t border-white/5 px-4 py-2 flex items-center justify-around z-50">
          <button
            onClick={() => setMobileTab('explorador')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              mobileTab === 'explorador' ? 'text-neonBlue scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Explorador</span>
          </button>
          
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              mobileTab === 'chat' ? 'text-neonBlue scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Auditor RAG</span>
          </button>
          
          <button
            onClick={() => setMobileTab('ajustes')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              mobileTab === 'ajustes' ? 'text-neonBlue scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Ajustes</span>
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen bg-rafamDark-900 text-slate-100 flex flex-col selection:bg-neonBlue/30 selection:text-white antialiased">
      {/* Barra superior de navegación */}
      <Navbar onSync={fetchEstructura} />

      {/* Cuerpo principal de la aplicación */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Jerárquico a la izquierda */}
        <Sidebar
          estructura={estructura}
          loading={loading}
          activeNode={activeNode}
          onSelectNode={handleSelectNode}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          onQuickAsk={handleQuickAsk}
        />

        {/* Dashboard y Consola a la derecha */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Contenedor del Dashboard con altura controlada */}
          <div className={`relative transition-all duration-300 flex flex-col overflow-hidden ${dashboardCollapsed ? 'h-11 flex-none' : 'flex-1'}`}>
            {dashboardCollapsed ? (
              // Barra minimizada simple
              <div 
                onClick={() => setDashboardCollapsed(false)}
                className="px-6 py-2.5 bg-rafamDark-900 border-b border-white/10 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition-all text-xs font-mono font-bold tracking-wider text-slate-300 h-full"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-neonBlue animate-pulse" />
                  <span>Explorador - {getModuleById(activeModule).nombre} (Minimizado)</span>
                  {activeNode && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neonBlue/15 text-neonBlue border border-neonBlue/20 text-[10px] ml-2">
                      Contexto: {activeNode.nombre} ({activeNode.codigo})
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDashboardCollapsed(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                  title="Expandir explorador"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Dashboard completo con su botón de colapsar superpuesto en la esquina superior derecha
              <>
                <Dashboard 
                  activeNode={activeNode} 
                  activeModule={activeModule}
                  onQuickAsk={handleQuickAsk}
                />
                <button
                  onClick={() => setDashboardCollapsed(true)}
                  title="Contraer explorador"
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors z-30"
                >
                  <ChevronUp className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>

          {/* Consola de chat integrada al pie */}
          <ChatConsole
            activeNode={activeNode}
            triggerQueryText={triggerQueryText}
            clearTriggerQuery={clearTriggerQuery}
            dashboardCollapsed={dashboardCollapsed}
            messages={chatMessages}
            setMessages={setChatMessages}
            activeModule={activeModule}
          />
        </div>
      </div>
    </div>
  );
}
