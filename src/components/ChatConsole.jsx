import React, { useState, useRef, useEffect } from 'react';
import { getBackendUrl } from '../utils/config';
import { 
  Terminal, 
  Send, 
  Trash2, 
  Download, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  CornerDownRight,
  Brain
} from 'lucide-react';
import { getModuleById } from '../utils/modules';

export default function ChatConsole({ 
  activeNode, 
  triggerQueryText, 
  clearTriggerQuery, 
  dashboardCollapsed, 
  forceFullscreen = false,
  messages,
  setMessages,
  activeModule = 'estructura_rafam'
}) {
  const [isOpen, setIsOpen] = useState(forceFullscreen);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (forceFullscreen) {
      setIsOpen(true);
    }
  }, [forceFullscreen]);
  const [lengthSetting, setLengthSetting] = useState('reducida'); // 'reducida' | 'extendida'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');

  const chatEndRef = useRef(null);

  // Escuchar si el dashboard se colapsó para abrir el chat automáticamente
  useEffect(() => {
    if (dashboardCollapsed) {
      setIsOpen(true);
    }
  }, [dashboardCollapsed]);

  // Escuchar si hay una consulta rápida enviada desde el Dashboard
  useEffect(() => {
    if (triggerQueryText) {
      handleSend(null, triggerQueryText);
      clearTriggerQuery();
      // Asegurarse de abrir el chat si estaba cerrado
      setIsOpen(true);
    }
  }, [triggerQueryText]);

  // Scroll automático al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e, overrideText = null, overrideLength = null) => {
    if (e) e.preventDefault();
    const query = (overrideText || inputText).trim();
    if (!query) return;

    if (!overrideText) {
      setInputText('');
    }

    const currentLength = overrideLength || lengthSetting;

    // Agregar mensaje del usuario a la lista
    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
      context: activeNode ? { ...activeNode } : null
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let apiQuery = query;
      if (activeModule !== 'estructura_rafam') {
        const currentModule = getModuleById(activeModule);
        if (currentModule && currentModule.notebookId) {
          apiQuery = `${query}\n\n[DIRECTIVA DE CONTROL CONTABLE RAG RAFAM]\nResponde única y exclusivamente basándote en el documento seleccionado. Si la respuesta no figura de forma explícita en él, di textualmente: "No se encontró información sobre este tema en el documento seleccionado". Bajo ninguna circunstancia uses conocimientos externos ni supongas datos.\n[FORCED_NOTEBOOK: ${currentModule.notebookId}]`;
        }
      }

      const payload = {
        query: apiQuery,
        length: currentLength,
        model: model,
        nodo_contexto: activeNode ? {
          tipo: activeNode.tipo,
          codigo: activeNode.codigo,
          nombre: activeNode.nombre,
          prog_cod: activeNode.prog_cod || null,
          jur_cod: activeNode.jur_cod || null
        } : null
      };

      const response = await fetch(`${getBackendUrl()}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al conectar con la API de RAG.');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        sender: 'rag',
        text: data.respuesta || 'Sin respuesta del modelo.',
        grafico: data.grafico || '',
        enrutamiento: data.enrutamiento || null,
        prompt_enriquecido: data.prompt_enriquecido || '',
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error) {
      console.error('Error querying RAG:', error);
      setMessages(prev => [...prev, {
        sender: 'system',
        text: `Error de Conexión: No se pudo contactar al servicio de RAG. Detalles: ${error.message}. Asegúrese de que el Back-End esté corriendo.`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar historial con confirmación previa
  const handleClear = () => {
    const confirmacion = window.confirm("¿Está seguro de que desea borrar todo el historial de la consola de chat?");
    if (!confirmacion) return;
    setMessages([
      {
        sender: 'system',
        text: 'Historial de consola borrado. Consola reiniciada.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Acciones rápidas / de seguimiento
  const handleQuickAction = (actionType) => {
    if (messages.length < 2) return; // No hay mensajes previos reales
    
    // Obtener la última pregunta REAL del usuario en el historial (ignorando comandos de seguimiento o exportación)
    const userMessages = messages.filter(m => 
      m.sender === 'user' && 
      !m.text.toLowerCase().startsWith('enviar notebookml') &&
      !m.text.toLowerCase().startsWith('analisis respuesta') &&
      m.text.toLowerCase() !== 'extendida' &&
      m.text.toLowerCase() !== 'reducida'
    );
    if (userMessages.length === 0) return;
    const lastUserQuery = userMessages[userMessages.length - 1].text;

    if (actionType === 'Extendida') {
      const confirmacion = window.confirm(`¿Desea solicitar la respuesta Extendida para la consulta anterior?\n\nConsulta: "${lastUserQuery}"`);
      if (!confirmacion) return;
      handleSend(null, lastUserQuery, 'extendida');
    } else if (actionType === 'Reducida') {
      const confirmacion = window.confirm(`¿Desea solicitar la respuesta Reducida para la consulta anterior?\n\nConsulta: "${lastUserQuery}"`);
      if (!confirmacion) return;
      handleSend(null, lastUserQuery, 'reducida');
    } else if (actionType === 'Análisis') {
      const confirmacion = window.confirm(`¿Desea solicitar el Análisis Crítico y Evaluación de Riesgos para la consulta anterior?\n\nConsulta: "${lastUserQuery}"`);
      if (!confirmacion) return;
      const analysisQuery = `Realiza un análisis crítico detallado y una evaluación de riesgos presupuestarios basándote en la consulta previa: "${lastUserQuery}"`;
      handleSend(null, analysisQuery);
    } else if (actionType === 'NotebookLM') {
      const now = new Date();
      const defaultName = `RAG Auditoría - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      const notebookName = window.prompt("Ingrese el nombre del nuevo cuaderno en NotebookLM:", defaultName);
      if (notebookName === null) return; // Cancelado
      
      const cleanName = notebookName.trim() || defaultName;
      const exportQuery = `enviar notebookml [TITLE: ${cleanName}]`;
      handleSend(null, exportQuery);
    } else if (actionType === 'Guardar') {
      handleSaveConversation();
    }
  };

  // Descargar conversación a un archivo .md
  const handleSaveConversation = () => {
    let content = `# Reporte de Auditoría y Consultas RAG RAFAM\nGenerado el: ${new Date().toLocaleString()}\n\n`;
    
    if (activeNode) {
      content += `## Nodo de Contexto Seleccionado\n- **Tipo**: ${activeNode.tipo}\n- **Código**: ${activeNode.codigo}\n- **Nombre**: ${activeNode.nombre}\n\n`;
    }

    messages.forEach(m => {
      if (m.sender === 'user') {
        content += `### 👤 Consulta Usuario - ${m.timestamp}\n> ${m.text}\n\n`;
      } else if (m.sender === 'rag') {
        content += `### 🤖 Respuesta RAG RAFAM - ${m.timestamp}\n${m.text}\n\n`;
        if (m.grafico) {
          content += `*Gráfico adjunto*: ${getBackendUrl()}/${m.grafico}\n\n`;
        }
        if (m.enrutamiento) {
          content += `#### Enrutamiento Contable:\n- **Jurisdicción**: ${m.enrutamiento.jurisdiccion_codigo || 'N/A'}\n- **Programa**: ${m.enrutamiento.programa_codigo || 'N/A'}\n- **Partida**: ${m.enrutamiento.partida_gasto_codigo || 'N/A'}\n- **Razón**: ${m.enrutamiento.razon_enrutamiento || 'N/A'}\n\n`;
        }
      } else if (m.sender === 'system') {
        content += `*Mensaje de Consola [${m.timestamp}]: ${m.text}*\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_rafam_${activeNode?.codigo || 'general'}_${new Date().toISOString().slice(0,10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generar la URL de la imagen del gráfico
  const getGraphUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${getBackendUrl()}/${cleanPath}`;
  };

  return (
    <div 
      className={`flex flex-col overflow-hidden z-40 ${
        forceFullscreen
          ? 'flex-1 h-full bg-rafamDark-950/90'
          : `glass border-t border-white/10 transition-all duration-300 ${
              isFullscreen 
                ? 'absolute inset-0 h-full' 
                : !isOpen 
                  ? 'h-11 flex-none' 
                  : dashboardCollapsed
                    ? 'flex-1' 
                    : 'h-80 md:h-[400px] flex-none'
            }`
      }`}
    >
      {/* Cabecera de la Consola */}
      <div 
        onClick={() => !isOpen && setIsOpen(true)}
        className={`px-4 py-2 bg-rafamDark-900/60 border-b border-white/5 flex items-center justify-between cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-300">
          <Terminal className={`w-4 h-4 text-neonBlue ${loading ? 'animate-pulse' : ''}`} />
          <span>Consola Inteligente - {getModuleById(activeModule).nombre}</span>
          {activeNode && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neonBlue/15 text-neonBlue border border-neonBlue/20 text-[10px]">
              Contexto: {activeNode.nombre} ({activeNode.codigo})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {/* Selector de Longitud */}
          <div className="flex items-center gap-1.5 bg-rafamDark-950 px-2 py-1 rounded border border-white/5">
            <span className="text-[9px] font-mono text-slate-400">Longitud:</span>
            <button
              onClick={() => setLengthSetting('reducida')}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
                lengthSetting === 'reducida' 
                  ? 'bg-neonBlue/20 text-neonBlue border border-neonBlue/30' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Reducida
            </button>
            <button
              onClick={() => setLengthSetting('extendida')}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
                lengthSetting === 'extendida' 
                  ? 'bg-neonBlue/20 text-neonBlue border border-neonBlue/30' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Extendida
            </button>
          </div>

          {/* Selector de Modelo */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-rafamDark-950 border border-white/5 text-slate-400 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none focus:border-neonBlue/30"
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
          </select>

          {/* Botones de control */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
            <button
              onClick={handleClear}
              title="Borrar consola"
              className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors hidden md:block"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            {!forceFullscreen && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-rafamDark-950/80 font-mono text-xs">
          {/* Feed de mensajes */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((m, idx) => {
              if (m.sender === 'system') {
                return (
                  <div key={idx} className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex gap-2 items-start ${
                    m.isError 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}>
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{m.text}</div>
                  </div>
                );
              }

              if (m.sender === 'user') {
                return (
                  <div key={idx} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] bg-neonBlue/10 border border-neonBlue/20 rounded-xl rounded-tr-none px-4 py-2.5 text-slate-200">
                      <div className="text-[10px] text-neonBlue/80 font-bold mb-1 flex items-center gap-1.5">
                        <span>👤 AUDITOR</span>
                        {m.context && (
                          <span className="px-1 text-[8px] bg-neonBlue/20 text-neonBlue rounded border border-neonBlue/30">
                            Contexto: {m.context.codigo}
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-line text-[11px] leading-relaxed">{m.text}</div>
                    </div>
                    <span className="text-[8px] text-slate-600 mr-2">{m.timestamp}</span>
                  </div>
                );
              }

              // Mensaje del RAG
              return (
                <div key={idx} className="flex flex-col items-start gap-1">
                  <div className="max-w-[90%] bg-rafamDark-900 border border-white/5 rounded-xl rounded-tl-none px-4 py-3 text-slate-200 shadow-md">
                    <div className="text-[10px] text-neonPurple font-bold mb-2 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-neonPurple" />
                      <span>🤖 RAG RAFAM ENGINE</span>
                    </div>
                    
                    {/* Cuerpo de respuesta del RAG */}
                    <div className="whitespace-pre-line text-[11px] leading-relaxed font-sans text-slate-300">
                      {m.text}
                    </div>

                    {/* Gráfico retornado por el API */}
                    {m.grafico && (
                      <div className="mt-4 p-3 bg-rafamDark-950 rounded-xl border border-white/5 flex flex-col items-center">
                        <span className="text-[9px] font-mono text-neonBlue mb-2 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Gráfica contable generada
                        </span>
                        <img 
                          src={getGraphUrl(m.grafico)} 
                          alt="Visualización Presupuestaria"
                          className="max-h-72 rounded border border-white/10 object-contain hover:scale-[1.02] transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400/0b0f19/00f0ff?text=Grafico+Presupuestario';
                          }}
                        />
                      </div>
                    )}

                    {/* Enrutamiento presupuestario de RAG */}
                    {m.enrutamiento && (
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono bg-rafamDark-950/40 p-2 rounded">
                        <div>
                          <span className="text-slate-500 block">Jurisdicción:</span>
                          <span className="text-neonBlue font-semibold">{m.enrutamiento.jurisdiccion_codigo || 'No enrutado'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Programa:</span>
                          <span className="text-neonPurple font-semibold">{m.enrutamiento.programa_codigo || 'No enrutado'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Partida Gasto:</span>
                          <span className="text-slate-300 font-semibold">{m.enrutamiento.partida_gasto_codigo || 'No enrutado'}</span>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className="text-slate-500 block">Motivo:</span>
                          <span className="text-slate-400 truncate block hover:text-white cursor-help" title={m.enrutamiento.razon_enrutamiento}>
                            {m.enrutamiento.razon_enrutamiento || 'Autodetectado'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-600 ml-2">{m.timestamp}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3 text-neonBlue text-[11px] py-2 animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neonBlue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neonBlue"></span>
                </span>
                <span>RAG procesando consulta y enrutamiento...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Acciones Rápidas (Seguimiento) */}
          <div className="px-4 py-2 border-t border-white/5 bg-rafamDark-900/40 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider mr-2 uppercase">Seguimiento:</span>
            <button
              onClick={() => handleQuickAction('Extendida')}
              disabled={loading || messages.length < 2}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-neonBlue hover:border-neonBlue/30 hover:bg-neonBlue/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Extendida
            </button>
            <button
              onClick={() => handleQuickAction('Reducida')}
              disabled={loading || messages.length < 2}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-neonBlue hover:border-neonBlue/30 hover:bg-neonBlue/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Reducida
            </button>
            <button
              onClick={() => handleQuickAction('Análisis')}
              disabled={loading || messages.length < 2}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-neonPurple hover:border-neonPurple/30 hover:bg-neonPurple/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Análisis
            </button>
            <button
              onClick={() => handleQuickAction('NotebookLM')}
              disabled={loading || messages.length < 2}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-neonBlue hover:border-neonBlue/30 hover:bg-neonBlue/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Enviar NotebookLM
            </button>
            <button
              onClick={() => handleQuickAction('Guardar')}
              disabled={messages.length < 2}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none ml-auto flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Guardar Reporte
            </button>
          </div>

          {/* Formulario de Input */}
          <form 
            onSubmit={(e) => handleSend(e)}
            className="p-3 bg-rafamDark-900 border-t border-white/5 flex gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeNode ? `Preguntar sobre [${activeNode.nombre}]...` : "Preguntar sobre el presupuesto municipal general..."}
              className="flex-1 bg-rafamDark-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neonBlue/50 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 rounded-xl bg-gradient-to-r from-neonBlue to-neonPurple text-rafamDark-900 hover:from-neonBlue/90 hover:to-neonPurple/90 font-bold active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ejecutar</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
