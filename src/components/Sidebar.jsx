import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Search, 
  FolderOpen, 
  FileText, 
  ChevronLeft, 
  ChevronRightSquare,
  Network,
  TrendingDown,
  TrendingUp,
  Tag,
  BookOpen,
  Landmark
} from 'lucide-react';
import { modulesList, getModuleById } from '../utils/modules';

export default function Sidebar({ 
  estructura, 
  loading, 
  onSelectNode, 
  activeNode, 
  collapsed, 
  setCollapsed,
  activeModule = 'estructura_rafam',
  onModuleChange
}) {
  const [activeTab, setActiveTab] = useState('gastos'); // 'gastos', 'objeto', 'recursos'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleExpand = (nodeKey, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));
  };

  // Filtrado de datos por el buscador
  const filterList = (list, fields) => {
    if (!searchTerm) return list;
    return list.filter(item => 
      fields.some(field => 
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Construir la estructura jerárquica de gastos
  const getJurisdiccionesFiltradas = () => {
    if (!estructura) return [];
    const juris = estructura.jurisdicciones || [];
    const progs = estructura.programas || [];

    // Si hay término de búsqueda, filtramos de forma inteligente
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Buscamos jurisdicciones que coincidan, o programas que coincidan, o actividades que coincidan
      return juris.map(j => {
        const jMatches = j.nombre.toLowerCase().includes(term) || j.codigo.includes(term);
        const jProgs = progs.filter(p => p.jurisdiccion_codigo === j.codigo);
        
        const filteredProgs = jProgs.map(p => {
          const pMatches = p.nombre.toLowerCase().includes(term) || p.codigo.includes(term);
          const filteredActs = (p.actividades || []).filter(a => 
            a.nombre.toLowerCase().includes(term) || a.codigo.includes(term)
          );
          
          if (pMatches || filteredActs.length > 0) {
            return { ...p, actividades: p.actividades, matches: true };
          }
          return null;
        }).filter(Boolean);

        if (jMatches || filteredProgs.length > 0) {
          // Si coincide algo, forzamos que esta jurisdicción esté expandida
          // de forma no intrusiva
          return { ...j, programas: filteredProgs, matches: true };
        }
        return null;
      }).filter(Boolean);
    }

    // Si no hay término de búsqueda, devolvemos la estructura normal
    return juris.map(j => ({
      ...j,
      programas: progs.filter(p => p.jurisdiccion_codigo === j.codigo)
    }));
  };

  const jurisdiccionesTree = getJurisdiccionesFiltradas();
  const gastosObjetoFiltrados = filterList(estructura?.gastos_objeto || [], ['codigo', 'nombre']);
  const recursosRubroFiltrados = filterList(estructura?.recursos_rubro || [], ['codigo', 'nombre']);

  const handleNodeClick = (node, tipo, extra = {}) => {
    onSelectNode({
      codigo: node.codigo,
      nombre: node.nombre,
      tipo: tipo,
      ...extra
    });
  };

  const isNodeActive = (codigo, tipo) => {
    return activeNode && activeNode.codigo === codigo && activeNode.tipo === tipo;
  };

  return (
    <div 
      className={`relative h-[calc(100vh-77px)] glass border-r border-white/5 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-full md:w-80 lg:w-96'
      }`}
    >
      {/* Botón para colapsar / expandir (oculto en móvil, activo en tablets y PC) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-rafamDark-800 border border-white/10 hover:border-neonBlue/40 text-slate-400 hover:text-neonBlue flex items-center justify-center z-40 transition-colors shadow-lg hidden md:flex"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center py-6 gap-6 h-full text-slate-400">
          <div className="rotate-90 origin-left translate-x-2 translate-y-4 whitespace-nowrap text-xs font-mono font-bold tracking-widest text-slate-500">
            ESTRUCTURA PRESUPUESTARIA
          </div>
        </div>
      ) : (
        <>
          {/* Selector de Módulo RAG */}
          <div className="p-4 border-b border-white/5 bg-rafamDark-950/20">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold mb-2 flex items-center gap-1.5 select-none">
              <Layers className="w-3.5 h-3.5 text-neonPurple" />
              <span>Módulo RAG Activo</span>
            </label>
            <select
              value={activeModule}
              onChange={(e) => onModuleChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-rafamDark-900 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-neonBlue/50 transition-all cursor-pointer font-sans"
            >
              {modulesList.map((m) => (
                <option key={m.id} value={m.id} className="bg-rafamDark-900 text-slate-200">
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {activeModule === 'estructura_rafam' ? (
            <>
              {/* Header del Sidebar (Buscador y Tabs) */}
              <div className="p-4 border-b border-white/5">
                {/* Buscador */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar código o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-rafamDark-900 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neonBlue/50 focus:ring-1 focus:ring-neonBlue/30 transition-all font-mono"
                  />
                </div>

                {/* Pestañas de categoría */}
                <div className="flex bg-rafamDark-900 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setActiveTab('gastos')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'gastos'
                        ? 'bg-gradient-to-r from-neonBlue/15 to-neonPurple/15 text-neonBlue border border-neonBlue/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Gastos</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('objeto')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'objeto'
                        ? 'bg-gradient-to-r from-neonBlue/15 to-neonPurple/15 text-neonBlue border border-neonBlue/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Objeto</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('recursos')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'recursos'
                        ? 'bg-gradient-to-r from-neonBlue/15 to-neonPurple/15 text-neonBlue border border-neonBlue/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Recursos</span>
                  </button>
                </div>
              </div>

              {/* Lista del Árbol (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar select-none">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                    <div className="w-8 h-8 rounded-full border-2 border-neonBlue border-t-transparent animate-spin"></div>
                    <span className="text-xs font-mono">Cargando catálogo contable...</span>
                  </div>
                ) : (
                  <>
                    {/* PESTAÑA: ESTRUCTURA DE GASTOS */}
                    {activeTab === 'gastos' && (
                      <div className="space-y-1 font-mono text-xs">
                        {jurisdiccionesTree.length === 0 ? (
                          <div className="text-center py-6 text-slate-500">No se encontraron resultados</div>
                        ) : (
                          jurisdiccionesTree.map((j) => {
                            const jKey = `j_${j.codigo}`;
                            const isExpanded = expandedNodes[jKey] || searchTerm;
                            const isActive = isNodeActive(j.codigo, 'jurisdiccion');

                            return (
                              <div key={j.codigo} className="space-y-0.5">
                                <div
                                  onClick={() => handleNodeClick(j, 'jurisdiccion')}
                                  className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-neonBlue/10 border border-neonBlue/30 text-neonBlue'
                                      : 'hover:bg-white/5 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Landmark className="w-3.5 h-3.5 shrink-0 text-neonBlue" />
                                    <span className="truncate">{j.nombre}</span>
                                  </div>
                                  {j.programas && j.programas.length > 0 && (
                                    <button
                                      onClick={(e) => toggleExpand(jKey, e)}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>

                                {isExpanded && j.programas && j.programas.length > 0 && (
                                  <div className="pl-4 ml-3 border-l border-white/5 space-y-0.5">
                                    {j.programas.map((p) => {
                                      const pKey = `p_${j.codigo}_${p.codigo}`;
                                      const isPExpanded = expandedNodes[pKey] || searchTerm;
                                      const isPActive = isNodeActive(p.codigo, 'programa', { jur_cod: j.codigo });

                                      return (
                                        <div key={p.codigo} className="space-y-0.5">
                                          <div
                                            onClick={() => handleNodeClick(p, 'programa', { jur_cod: j.codigo })}
                                            className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                                              isPActive
                                                ? 'bg-neonPurple/10 border border-neonPurple/30 text-neonPurple font-semibold'
                                                : 'hover:bg-white/5 text-slate-400 hover:text-slate-300'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 truncate">
                                              <FolderOpen className="w-3 h-3 text-neonPurple shrink-0" />
                                              <span className="truncate">{p.nombre}</span>
                                            </div>
                                            {p.actividades && p.actividades.length > 0 && (
                                              <button
                                                onClick={(e) => toggleExpand(pKey, e)}
                                                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                              >
                                                {isPExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              </button>
                                            )}
                                          </div>

                                          {isPExpanded && p.actividades && p.actividades.length > 0 && (
                                            <div className="pl-3 ml-2 border-l border-white/5 space-y-0.5">
                                              {p.actividades.map((a) => {
                                                const isAActive = isNodeActive(a.codigo, 'actividad', { jur_cod: j.codigo, prog_cod: p.codigo });
                                                return (
                                                  <div
                                                    key={a.codigo}
                                                    onClick={() => handleNodeClick(a, 'actividad', { jur_cod: j.codigo, prog_cod: p.codigo })}
                                                    className={`px-2 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 truncate ${
                                                      isAActive
                                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold'
                                                        : 'hover:bg-white/5 text-slate-500 hover:text-slate-400 text-[11px]'
                                                    }`}
                                                  >
                                                    <FileText className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                                    <span className="truncate">{a.nombre}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* PESTAÑA: CLASIFICADOR POR OBJETO DEL GASTO */}
                    {activeTab === 'objeto' && (
                      <div className="space-y-1 font-mono text-xs">
                        {gastosObjetoFiltrados.length === 0 ? (
                          <div className="text-center py-6 text-slate-500">No se encontraron partidas</div>
                        ) : (
                          gastosObjetoFiltrados.map((g) => {
                            const isActive = isNodeActive(g.codigo, 'partida');
                            return (
                              <div
                                key={g.codigo}
                                onClick={() => handleNodeClick(g, 'partida')}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-neonBlue/10 border border-neonBlue/30 text-neonBlue'
                                    : 'hover:bg-white/5 text-slate-300'
                                }`}
                              >
                                <Tag className="w-3.5 h-3.5 text-neonPurple shrink-0" />
                                <div className="truncate flex-1">
                                  <span className="text-[10px] font-bold text-slate-500 mr-2 bg-slate-500/10 px-1 py-0.5 rounded">{g.codigo}</span>
                                  <span className="font-sans font-medium">{g.nombre}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* PESTAÑA: CLASIFICADOR DE RECURSOS POR RUBRO */}
                    {activeTab === 'recursos' && (
                      <div className="space-y-1 font-mono text-xs">
                        {recursosRubroFiltrados.length === 0 ? (
                          <div className="text-center py-6 text-slate-500">No se encontraron recursos</div>
                        ) : (
                          recursosRubroFiltrados.map((r) => {
                            const isActive = isNodeActive(r.codigo, 'recurso');
                            return (
                              <div
                                key={r.codigo}
                                onClick={() => handleNodeClick(r, 'recurso')}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-neonBlue/10 border border-neonBlue/30 text-neonBlue'
                                    : 'hover:bg-white/5 text-slate-300'
                                }`}
                              >
                                <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <div className="truncate flex-1">
                                  <span className="text-[10px] font-bold text-slate-500 mr-2 bg-slate-500/10 px-1 py-0.5 rounded">{r.codigo}</span>
                                  <span className="font-sans font-medium">{r.nombre}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Ficha Informativa del Documento Activo */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4 select-none">
              <div className="relative mb-2">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-neonBlue to-neonPurple rounded-2xl blur opacity-40 animate-pulse"></div>
                <div className="relative bg-rafamDark-900 p-4 rounded-2xl border border-white/10 flex items-center justify-center">
                  {React.createElement(getModuleById(activeModule).icon || BookOpen, { className: "w-8 h-8 text-neonBlue" })}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-100 tracking-wide font-sans">
                {getModuleById(activeModule).nombre}
              </h3>

              <span className="px-2.5 py-0.5 text-[8px] font-mono tracking-wider bg-neonBlue/10 text-neonBlue border border-neonBlue/20 rounded-md uppercase font-bold">
                Consulta Exclusiva RAG
              </span>

              <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mt-2">
                {getModuleById(activeModule).descripcion}
              </p>

              <div className="w-full mt-6 bg-rafamDark-950/40 border border-white/5 rounded-xl p-4 text-left flex gap-3 items-start">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Foco del Auditor
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-sans">
                    Las preguntas enviadas al chat se responderán basándose única y estrictamente en este documento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
