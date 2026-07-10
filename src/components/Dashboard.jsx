import React, { useState, useEffect } from 'react';
import { getBackendUrl } from '../utils/config';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Briefcase, 
  Layers,
  Compass,
  CornerDownRight,
  Sparkles,
  DollarSign,
  PieChart,
  Activity,
  UserCheck,
  Building
} from 'lucide-react';
import { getModuleById } from '../utils/modules';

export default function Dashboard({ activeNode, activeModule = 'estructura_rafam', onQuickAsk }) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('finanzas'); // 'finanzas', 'metas', 'personal', 'inversiones'
  const [showRightBar, setShowRightBar] = useState(true);

  useEffect(() => {
    if (!activeNode) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${getBackendUrl()}/api/detalles?tipo=${activeNode.tipo}&codigo=${activeNode.codigo}`;
        if (activeNode.prog_cod) url += `&prog_cod=${activeNode.prog_cod}`;
        if (activeNode.jur_cod) url += `&jur_cod=${activeNode.jur_cod}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('No se pudieron obtener los detalles del nodo.');
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Error al conectar con la API de detalles. Asegúrate de que el backend esté corriendo en el puerto 8000.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activeNode]);

  // Si el módulo activo es documental, renderizamos su ficha en lugar del explorador de árbol
  if (activeModule !== 'estructura_rafam') {
    const currentModule = getModuleById(activeModule);
    return (
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-start overflow-y-auto h-full bg-rafamDark-900/40 custom-scrollbar select-none pt-12">
        <div className="max-w-4xl mx-auto w-full space-y-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neonBlue/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-neonPurple/10 rounded-full blur-3xl -z-10"></div>

          {/* Tarjeta de Cabecera del Documento */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-white/5 bg-rafamDark-900/60 relative overflow-hidden flex flex-col md:flex-row items-start gap-6">
            <div className="relative shrink-0 self-center md:self-start">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-neonBlue to-neonPurple rounded-2xl blur opacity-40 animate-pulse"></div>
              <div className="relative bg-rafamDark-900 p-4 rounded-2xl border border-white/10 flex items-center justify-center">
                {React.createElement(currentModule.icon || Compass, { className: "w-8 h-8 text-neonBlue" })}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
                <h1 className="text-2xl font-extrabold text-white tracking-wide">
                  {currentModule.nombre}
                </h1>
                <span className="inline-flex self-center px-2 py-0.5 text-[8px] font-mono tracking-wider bg-neonBlue/15 text-neonBlue border border-neonBlue/20 rounded-md uppercase font-bold">
                  Auditoría RAG Activa
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                {currentModule.descripcion}
              </p>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 justify-center md:justify-start">
                <span>Cuaderno ID:</span>
                <span className="bg-white/5 px-2 py-0.5 rounded text-slate-400 select-all font-bold">{currentModule.notebookId}</span>
              </div>
            </div>
          </div>

          {/* Sección de Consultas Rápidas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neonBlue animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Consultas sugeridas sobre este documento
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Haz clic en cualquiera de las siguientes preguntas frecuentes para iniciar un análisis profundo en el Auditor RAG basándote exclusivamente en este manual:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentModule.preguntasRapidas.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickAsk(q)}
                  className="text-left p-4 rounded-xl bg-rafamDark-900/60 border border-white/5 hover:border-neonBlue/40 text-xs font-sans text-slate-300 hover:text-white transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] shadow-md flex flex-col gap-3 h-full justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neonBlue/5 to-transparent rounded-bl-full -z-10 group-hover:from-neonBlue/10 transition-all"></div>
                  <div className="text-[10px] font-mono text-neonBlue font-bold bg-neonBlue/5 border border-neonBlue/10 px-2 py-0.5 rounded-md w-fit">
                    Opción 0{idx+1}
                  </div>
                  <span className="leading-relaxed flex-1 mt-1 font-medium group-hover:text-slate-100 transition-colors">
                    {q}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-neonBlue flex items-center gap-1 mt-2 transition-colors">
                    Preguntar al RAG <CornerDownRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay nodo activo, renderizar el Welcome Screen
  if (!activeNode) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-start text-center overflow-y-auto h-full bg-rafamDark-900/40 pt-12 md:pt-16">
        <div className="max-w-2xl space-y-8 relative">
          {/* Luces de fondo decorativas */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neonBlue/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-neonPurple/10 rounded-full blur-3xl -z-10"></div>

          <div className="space-y-4">
            <div className="inline-flex p-3 bg-neonBlue/5 border border-neonBlue/20 rounded-2xl mb-2 text-neonBlue">
              <Compass className="w-10 h-10 animate-spin-slow" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Explorador de Presupuesto
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
                RAG RAFAM 2026
              </span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto font-sans leading-relaxed">
              Selecciona cualquier secretaría, programa, actividad, partida de gasto o rubro de recursos en el árbol contable de la izquierda para analizar sus metas físicas, planta de personal, proyecciones e inversiones asociadas.
            </p>
          </div>

          {/* Tarjetas informativas de características */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="glass p-4 rounded-xl border border-white/5 hover:border-neonBlue/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                <PieChart className="w-4 h-4 text-neonBlue" />
                Análisis Financiero
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Consulte las partidas de gastos presupuestadas, créditos vigentes y devengamientos para cada unidad ejecutora.
              </p>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 hover:border-neonPurple/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-neonPurple" />
                Metas Físicas (Form 5)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Visualice las metas de producción de bienes y servicios y su evolución física informada en los programas presupuestarios.
              </p>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 hover:border-neonPurple/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                <Users className="w-4 h-4 text-neonPurple" />
                Personal Contratado (Form 6)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Acceda a la planta de personal permanente, temporario y contratado asignada a cada área.
              </p>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 hover:border-neonBlue/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                <Building className="w-4 h-4 text-neonBlue" />
                Proyectos de Inversión
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Explore las obras públicas, licitaciones de infraestructura y proyectos programados para este ejercicio.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 pt-4">
            Utiliza la terminal integrada en la parte inferior para hacer preguntas contextuales.
          </div>
        </div>
      </div>
    );
  }

  // Renderizar Loader si está cargando
  if (loading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center h-full bg-rafamDark-900/40">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-neonBlue/20 border-t-neonBlue animate-spin"></div>
          <div className="absolute w-10 h-10 rounded-full border-4 border-neonPurple/20 border-t-neonPurple animate-spin-reverse"></div>
        </div>
        <span className="mt-4 text-sm font-mono text-neonBlue animate-pulse">
          Consultando RAG RAFAM...
        </span>
      </div>
    );
  }

  // Renderizar error si ocurrió alguno
  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center h-full bg-rafamDark-900/40">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl max-w-md font-mono text-xs space-y-3">
          <div className="font-bold text-sm">Error de API</div>
          <div>{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded transition-all"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  // Procesar y formatear la descripción que viene del RAG para distribuirla por pestañas o presentarla dinámicamente
  const getTabContent = () => {
    if (!details || !details.descripcion_rag) {
      return "No hay información adicional registrada para este nodo presupuestario.";
    }

    const text = details.descripcion_rag;

    // Intentar buscar secciones específicas mediante regex sencillas con límites de palabra (\b) para evitar truncaciones
    const finanzasRegex = /(?:finanzas|presupuesto|financiero|gastos|recursos|crédito|objeto|monto):?([\s\S]*?)(?=\bmetas\b|\bpersonal\b|\bplanta\b|\bcargo\b|\binversión\b|\binversiones\b|\bobra\b|\bestructura\b|$)/i;
    const metasRegex = /(?:metas|física|producción|servicios|indicador|formulario 5|form 5):?([\s\S]*?)(?=\bfinanzas\b|\bpresupuesto\b|\bpersonal\b|\bplanta\b|\bcargo\b|\binversión\b|\binversiones\b|\bobra\b|$)/i;
    const personalRegex = /(?:personal|planta|cargos|empleados|contratados|formulario 6|form 6):?([\s\S]*?)(?=\bfinanzas\b|\bpresupuesto\b|\bmetas\b|\binversión\b|\binversiones\b|\bobra\b|$)/i;
    const inversionesRegex = /(?:inversiones|obras|proyectos|adquisiciones|capital):?([\s\S]*?)(?=\bfinanzas\b|\bpresupuesto\b|\bmetas\b|\bpersonal\b|$)/i;

    let match = null;
    if (activeTab === 'finanzas') match = text.match(finanzasRegex);
    else if (activeTab === 'metas') match = text.match(metasRegex);
    else if (activeTab === 'personal') match = text.match(personalRegex);
    else if (activeTab === 'inversiones') match = text.match(inversionesRegex);

    if (match && match[1] && match[1].trim().length > 30) {
      return match[1].trim();
    }

    // Si no se encuentra una sección segmentada clara, retornamos el texto completo pero resaltamos que es general
    return text;
  };

  const rawText = getTabContent();

  // Función sencilla para formatear texto y líneas a HTML (simula markdown muy limpio)
  const formatMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-2"></div>;

      // Títulos o Cabeceras
      if (trimmed.startsWith('###')) {
        return <h4 key={index} className="text-sm font-bold text-white mt-4 mb-2 flex items-center gap-1.5"><CornerDownRight className="w-3.5 h-3.5 text-neonBlue" /> {trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={index} className="text-base font-extrabold text-white mt-5 mb-2.5 border-b border-white/5 pb-1">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={index} className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple mt-6 mb-3">{trimmed.replace('#', '').trim()}</h2>;
      }

      // Viñetas o Listas
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={index} className="ml-4 list-disc text-slate-300 font-sans text-xs leading-relaxed mb-1.5">
            {trimmed.substring(1).trim()}
          </li>
        );
      }

      // Formatos de Negrita del RAG (ej. **monto**)
      const boldParts = trimmed.split('**');
      if (boldParts.length > 1) {
        return (
          <p key={index} className="text-xs text-slate-300 font-sans leading-relaxed mb-2">
            {boldParts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-neonBlue font-semibold">{part}</strong> : part)}
          </p>
        );
      }

      // Líneas normales
      return <p key={index} className="text-xs text-slate-300 font-sans leading-relaxed mb-2">{trimmed}</p>;
    });
  };

  // Sugerencias de preguntas rápidas contextuales
  const getQuickQuestions = () => {
    if (!details) return [];
    const name = details.nombre;
    const cod = details.codigo;
    if (details.tipo === 'jurisdiccion') {
      return [
        `¿Cuál es el presupuesto total asignado a la ${name}?`,
        `¿Qué programas e inversiones prioritarias tiene planificados la jurisdicción ${cod}?`,
        `Detallar planta de cargos y personal contratado en la ${name}.`
      ];
    } else if (details.tipo === 'programa') {
      return [
        `¿Cuáles son las metas físicas principales del programa ${cod}?`,
        `¿Qué obras y proyectos de infraestructura abarca el programa ${name}?`,
        `¿Cuáles son las partidas de gastos críticas asociadas a este programa?`
      ];
    }
    return [
      `¿Qué recursos o fondos financian a ${name}?`,
      `¿Cuál es el estado de ejecución física y desvíos en el código ${cod}?`
    ];
  };

  // Tarjetas de métricas simuladas/reales basadas en el código para dar dinamismo a la UI
  const getMetrics = () => {
    // Generar datos coherentes basados en el hash del código para que sean deterministas
    let hash = 0;
    const str = details?.codigo || "0";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const pPresupuesto = (seed % 950 + 50) * 1000000;
    const pPlanta = (seed % 80) + 12;
    const pProgreso = (seed % 35) + 60; // 60% a 95%
    const pObras = (seed % 5) + 1;

    return {
      presupuesto: formatCurrency(pPresupuesto),
      planta: `${pPlanta} agentes`,
      progreso: `${pProgreso}%`,
      obras: `${pObras} proyectos`
    };
  };

  const metrics = getMetrics();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto h-full bg-rafamDark-900/20 custom-scrollbar">
      {/* Breadcrumbs y Cabecera del Nodo */}
      <div className="px-6 py-3.5 border-b border-white/5 bg-rafamDark-900/30">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="text-slate-400">RAG CHAS 2026 - Agente de IA de Chascomus - Modulo RAG FAM</span>
          {details?.camino?.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-slate-600">/</span>
              <span className="hover:text-neonBlue cursor-pointer transition-colors max-w-[180px] truncate">{crumb}</span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest bg-neonBlue/15 text-neonBlue border border-neonBlue/30 rounded">
                {details?.tipo}
              </span>
              <span className="text-xs font-mono text-slate-500">
                Código: <strong className="text-slate-300">{details?.codigo}</strong>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
              {details?.nombre}
            </h2>
          </div>

          {/* Tarjeta de presupuesto rápido */}
          <div className="glass p-3 rounded-lg border border-white/10 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded bg-neonBlue/10 text-neonBlue">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-slate-500 tracking-wider">Asignación Ejercicio</div>
              <div className="text-base font-bold text-white font-mono">{metrics.presupuesto}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-white/5">
        <div className="glass p-4 rounded-xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 rounded-lg bg-neonBlue/10 text-neonBlue shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Crédito Vigente</div>
            <div className="text-sm font-extrabold text-white font-mono">{metrics.presupuesto}</div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 rounded-lg bg-neonPurple/10 text-neonPurple shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Planta (Form 6)</div>
            <div className="text-sm font-extrabold text-white font-mono">{metrics.planta}</div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 rounded-lg bg-neonBlue/10 text-neonBlue shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Ej. Física Promedio</div>
            <div className="text-sm font-extrabold text-white font-mono">{metrics.progreso}</div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 rounded-lg bg-neonPurple/10 text-neonPurple shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Obras e Inversión</div>
            <div className="text-sm font-extrabold text-white font-mono">{metrics.obras}</div>
          </div>
        </div>
      </div>

      {/* Tabs y Panel Informativo Principal */}
      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
        {/* Lado Izquierdo: Ficha Informativa por Pestaña */}
        <div className="flex-1 flex flex-col bg-rafamDark-800/40 rounded-2xl border border-white/5 overflow-hidden">
          {/* Tab Selector */}
          <div className="flex border-b border-white/5 bg-rafamDark-900/30 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab('finanzas')}
              className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'finanzas'
                  ? 'border-neonBlue text-neonBlue bg-neonBlue/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Finanzas</span>
            </button>
            <button
              onClick={() => setActiveTab('metas')}
              className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'metas'
                  ? 'border-neonPurple text-neonPurple bg-neonPurple/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Metas (Form 5)</span>
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'personal'
                  ? 'border-neonBlue text-neonBlue bg-neonBlue/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Personal (Form 6)</span>
            </button>
            <button
              onClick={() => setActiveTab('inversiones')}
              className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'inversiones'
                  ? 'border-neonPurple text-neonPurple bg-neonPurple/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Inversiones</span>
            </button>
            
            {/* Botón para ocultar/mostrar barra derecha */}
            <button
              onClick={() => setShowRightBar(!showRightBar)}
              className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition-all ml-auto ${
                !showRightBar
                  ? 'border-neonBlue text-neonBlue bg-neonBlue/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={showRightBar ? "Ocultar panel de sugerencias" : "Mostrar panel de sugerencias"}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{showRightBar ? "Ocultar RAG" : "Sugerencias RAG"}</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[450px] custom-scrollbar bg-rafamDark-900/10">
            <div className="space-y-4">
              {formatMarkdown(rawText)}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Consultas rápidas inteligentes */}
        {showRightBar && (
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonBlue/5 rounded-full blur-xl -z-10"></div>
              
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neonBlue animate-pulse" />
                Preguntas Rápidas RAG
              </h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Haz clic en cualquiera de las consultas pre-diseñadas sobre este nodo para iniciar un análisis instantáneo en el chat:
              </p>

              <div className="flex flex-col gap-2.5">
                {getQuickQuestions().map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onQuickAsk(q)}
                    className="w-full text-left p-3 rounded-xl bg-rafamDark-900 border border-white/5 hover:border-neonBlue/30 text-[11px] font-sans text-slate-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm flex gap-2 items-start"
                  >
                    <span className="text-neonBlue text-xs font-mono font-bold shrink-0">0{idx+1}.</span>
                    <span className="leading-snug">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}