# Guía de Inicio: Ecosistema RAGCHAS & RAG RAFAM

Esta guía detalla el procedimiento para iniciar el ecosistema completo de RAGCHAS (servicios de WhatsApp y RAG) y RAG RAFAM (interfaz web de presupuesto), junto con los comandos disponibles para interactuar a través de WhatsApp.

---

## 🚀 Método de Inicio Completo (Recomendado)

Para levantar todos los servicios integrados (WhatsApp, n8n, el Puente de NotebookLM, la API Backend y la interfaz web RAFAM) en un solo clic, debes ejecutar el lanzador maestro:

1. Dirígete a la carpeta raíz de desarrollos en Windows:
   `C:\Gustavo\`
2. Haz doble clic en el archivo por lotes:
   **`iniciar_RAG_Completo.bat`**

Este script se encargará de liberar los puertos correspondientes y levantar 5 terminales independientes con los siguientes servicios:
* **WhatsApp Gateway (Puerto 3000):** Servidor que conecta con el bot de WhatsApp.
* **Puente RAG (Puerto 3001):** Conector intermedio con NotebookLM.
* **n8n (Puerto 5678):** Motor de automatización de flujos de trabajo.
* **RAG RAFAM API Backend (Puerto 8000):** Servidor FastAPI de clasificación y enrutamiento.
* **React Frontend (Puerto 5173):** Interfaz web de visualización y consulta.

Al finalizar el cargador, se abrirán automáticamente en tu navegador web predeterminado las siguientes pestañas:
* **Simulador de WhatsApp:** `http://localhost:3000/simulador.html`
* **Dashboard RAG RAFAM:** `http://localhost:5173`

---

## 🖥️ Método de Inicio Solo Web (Sin WhatsApp)

Si únicamente deseas trabajar con la interfaz web y realizar consultas desde el árbol contable (sin levantar los servicios de mensajería de WhatsApp ni n8n):

1. Dirígete a la carpeta del proyecto RAFAM:
   `C:\Gustavo\App RAFAM\`
2. Ejecuta el archivo:
   **`iniciar_rafam.bat`**

Este iniciará únicamente:
* La API Backend (Puerto 8000)
* El Frontend React (Puerto 5173)

---

## 📱 Guía de Comandos en WhatsApp

Una vez iniciado el simulador de WhatsApp (`http://localhost:3000/simulador.html`), puedes interactuar con el Agente enviando mensajes con los siguientes formatos (los comandos deben empezar por la palabra clave **`RAGCHAS`**):

### 🔍 Consultas de Presupuesto
* **`RAGCHAS c [pregunta]`**
  Realiza una consulta inteligente al ecosistema de NotebookLM.
  *Ejemplo:* `RAGCHAS c ¿Cuál es el presupuesto para la Secretaría de Salud en 2026?`
* **`RAGCHAS cuaderno [nº] [pregunta]`**
  Dirige tu consulta específicamente a un cuaderno contable en particular.
  *Ejemplo:* `RAGCHAS cuaderno 2 ¿Cuál es el presupuesto asignado para personal?`

### 📋 Listados e Información
* **`RAGCHAS cuadernos`**
  Lista todos los cuadernos presupuestarios disponibles en NotebookLM.
* **`RAGCHAS cuaderno [nº] fuentes`**
  Lista las fuentes cargadas (PDFs, Excel, etc.) en ese cuaderno específico.
* **`RAGCHAS comandos`**
  Muestra la guía rápida de comandos integrados en el chat.

### 🔄 Acciones de Seguimiento (Sobre la última respuesta)
* **`RAGCHAS Extendida`**
  Solicita al RAG que expanda la última respuesta con el máximo nivel de detalle analítico.
* **`RAGCHAS Reducida`**
  Solicita una síntesis compacta de la última consulta.
* **`RAGCHAS Analisis`**
  Genera un análisis crítico ejecutivo y evaluación de riesgos fiscales de la respuesta con Gemini.
* **`RAGCHAS Enviar`**
  Crea un nuevo cuaderno en NotebookLM y exporta la consulta previa y su análisis como una fuente.
