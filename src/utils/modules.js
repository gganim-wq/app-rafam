import { Database, BookOpen, Scale, FileText, Landmark, Calendar, Activity } from 'lucide-react';

export const modulesList = [
  {
    id: 'estructura_rafam',
    nombre: 'Estructura RAFAM',
    notebookId: null,
    icon: Database,
    descripcion: 'Explorador interactivo del árbol jerárquico contable de la Municipalidad de Chascomús. Acceda a la estructura de Jurisdicciones, Programas, Actividades, Recursos y Partidas de Gasto directamente desde la base de datos local SQLite.',
    preguntasRapidas: [
      '¿Cuáles son las jurisdicciones con mayor presupuesto asignado?',
      '¿Qué programas presupuestarios pertenecen a la Secretaría de Obras Públicas?',
      '¿Cuáles son los principales recursos presupuestados por tasas rurales?'
    ]
  },
  {
    id: 'manual_rafam',
    nombre: 'RAFAM (Manual)',
    notebookId: '1f69402a-dc80-4075-9815-325b3e538d30',
    icon: BookOpen,
    descripcion: 'Manual de Administración Financiera Municipal (RAFAM) de la Provincia de Buenos Aires. Regula los sistemas contables, de tesorería, crédito público, presupuesto y control interno de los municipios bonaerenses.',
    preguntasRapidas: [
      '¿Cuáles son las etapas formales del gasto público según el manual RAFAM?',
      '¿Qué función cumple el Clasificador por Objeto del Gasto y cómo se estructura?',
      '¿Cómo se define el momento del devengamiento de un recurso?'
    ]
  },
  {
    id: 'lom',
    nombre: 'LOM',
    notebookId: '88b5b0ff-92d5-4119-b813-c1b0d128d48d',
    icon: Scale,
    descripcion: 'Ley Orgánica de las Municipalidades de la Provincia de Buenos Aires (Decreto-Ley 6769/58). Define el marco institucional, las atribuciones del Concejo Deliberante, el Departamento Ejecutivo, la contabilidad municipal y las sanciones.',
    preguntasRapidas: [
      '¿Cuáles son las atribuciones y deberes del Concejo Deliberante según la LOM?',
      '¿Cómo se compone y organiza el Departamento Ejecutivo municipal?',
      '¿Cuáles son los requisitos y prohibiciones para ser concejal en la Provincia?'
    ]
  },
  {
    id: 'presupuesto_municipal',
    nombre: 'Presupuesto',
    notebookId: '1a068746-39ad-4129-b200-8df696c49e2e',
    icon: Landmark,
    descripcion: 'Presupuesto de la Municipalidad de Chascomús. Contiene la proyección de recursos, autorización de gastos, el ahorro, inversión y financiamiento municipal.',
    preguntasRapidas: [
      '¿Cuál es el monto total presupuestado de gastos y recursos para el ejercicio?',
      '¿Qué porcentaje del presupuesto se destina a gastos de personal y servicios?',
      '¿Cuáles son las principales fuentes de financiamiento proyectadas?'
    ]
  },
  {
    id: 'fiscal_impositiva',
    nombre: 'Fiscal e Impositiva',
    notebookId: '5a1b3b48-7a01-4d95-857c-ac1b290fbee6',
    icon: FileText,
    descripcion: 'Ordenanza Fiscal e Impositiva de la Municipalidad de Chascomús. Establece los derechos, tasas, alícuotas, contribuciones de mejoras y el régimen tributario municipal vigente.',
    preguntasRapidas: [
      '¿Cuáles son las alícuotas vigentes para la Tasa por Servicios Urbanos?',
      '¿Qué exenciones impositivas se contemplan para jubilados o personas con discapacidad?',
      '¿Cómo se calculan las multas y recargos por mora en el pago de tasas municipales?'
    ]
  },
  {
    id: 'calendario_fiscal',
    nombre: 'Calendario Fiscal',
    notebookId: '5a1b3b48-7a01-4d95-857c-ac1b290fbee6',
    icon: Calendar,
    descripcion: 'Calendario de vencimientos de tasas y derechos municipales de Chascomús. Regula las fechas límites de pago mensual, bimestral y las condiciones para pago anual anticipado.',
    preguntasRapidas: [
      '¿Cuáles son las fechas de vencimiento de la Tasa de Seguridad e Higiene?',
      '¿Cuándo vence la opción de pago anual anticipado y qué descuento tiene?',
      '¿Cuál es el calendario de vencimientos para las patentes de rodados y motos?'
    ]
  },
  {
    id: 'ejecucion_trimestral',
    nombre: 'Evolucion Trimestral',
    notebookId: 'fba1b6ed-3977-47cc-a42b-49d23d9811f0',
    icon: Activity,
    descripcion: 'Evolución y Stock del Pasivo de la Municipalidad de Chascomús. Detalla la deuda pública consolidada, deuda flotante con proveedores, compromisos financieros y plazos de amortización.',
    preguntasRapidas: [
      '¿Cuál es el stock de deuda flotante consolidado al cierre del último trimestre?',
      '¿Cómo evolucionaron los pasivos exigibles con proveedores en el período?',
      '¿Qué porcentaje representa la deuda pública sobre los recursos corrientes?'
    ]
  }
];

export const getModuleById = (id) => modulesList.find(m => m.id === id) || modulesList[0];
