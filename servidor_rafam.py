import os
import sys
import json
import sqlite3
import subprocess
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Asegurar encoding UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Importar funciones locales del enrutador
from asistente_rafam import (
    traducir_consulta_contable,
    obtener_detalles_nodo,
    generar_prompt_enriquecido,
    DB_PATH,
    obtener_cliente_gemini,
    MODELO_SELECCIONADO
)

app = FastAPI(title="RAG RAFAM Backend API", version="1.0.0")

# Habilitar CORS para conectar con el frontend de React (puerto 5173 u otros)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATOS_DIR = os.path.join(BASE_DIR, "datos")
JSON_PATH = os.path.join(DATOS_DIR, "estructura_2026.json")
RAGCHAS_API_URL = "http://localhost:3001/notebooklm/query"

# Notebook ID para el Presupuesto 2026 de Chascomús
NOTEBOOK_ID_2026 = "1a068746-39ad-4129-b200-8df696c49e2e"

class QueryRequest(BaseModel):
    query: str
    length: Optional[str] = "reducida"
    model: Optional[str] = "gemini-2.5-flash"
    active_module: Optional[str] = "estructura_rafam"
    nodo_contexto: Optional[Dict[str, Any]] = None  # Contiene tipo, codigo, prog_cod, jur_cod

class RouteRequest(BaseModel):
    query: str

def limpiar_salida_caja_nlm(text):
    """Limpia los bordes de caja ASCII y títulos adicionales de la respuesta de nlm CLI."""
    if not text:
        return ""
    
    # Intentar desglosar JSON si la salida de nlm es JSON
    try:
        data = json.loads(text)
        if "answer" in data:
            text = data["answer"]
    except json.JSONDecodeError:
        pass
        
    lineas = text.splitlines()
    cleaned = []
    for line in lineas:
        l = line.strip()
        if l.startswith("│") and l.endswith("│"):
            cleaned.append(line[1:-1].strip())
        elif l.startswith("╭") or l.startswith("╰"):
            continue
        else:
            cleaned.append(line)
    return "\n".join(cleaned).strip()

def tarea_sincronizar():
    """Ejecuta el script de sincronización en segundo plano."""
    script_path = os.path.join(BASE_DIR, "scripts", "sincronizar_estructura.py")
    print(f"Iniciando sincronización asíncrona: python {script_path}")
    subprocess.run(["python", script_path], capture_output=True, text=True, encoding="utf-8")
    print("Sincronización asíncrona completada.")

@app.get("/api/estructura")
def get_estructura():
    """Devuelve el árbol jerárquico contable completo."""
    if not os.path.exists(JSON_PATH):
        raise HTTPException(
            status_code=404, 
            detail="La estructura de datos no se ha sincronizado aún. Ejecuta el endpoint /api/sincronizar"
        )
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer estructura: {str(e)}")

@app.get("/api/detalles")
def get_detalles(tipo: str, codigo: str, prog_cod: Optional[str] = None, jur_cod: Optional[str] = None):
    """
    Muestra los detalles locales de SQLite y consulta a NotebookLM una
    explicación narrativa y metas asociadas al nodo.
    """
    detalles = obtener_detalles_nodo(tipo, codigo, prog_cod, jur_cod)
    if not detalles:
        raise HTTPException(status_code=404, detail="Nodo contable no encontrado en la base de datos local.")
    
    # Consultar a NotebookLM de forma dirigida
    prompt_explicacion = ""
    camino_str = " -> ".join(detalles.get("camino", []))
    
    if tipo == "jurisdiccion":
        prompt_explicacion = f"""
        Describe brevemente el rol, políticas, misiones u objetivos de la Jurisdicción: {camino_str} (Código: {codigo}) en el presupuesto municipal 2026 de Chascomús.
        No inventes datos. Si no hay descripción, resume en una oración su función administrativa.
        """
    elif tipo == "programa":
        prompt_explicacion = f"""
        Analiza las metas físicas, objetivos o finalidad del Programa: {camino_str} (Programa {codigo} de la Jurisdicción {jur_cod}) en el presupuesto municipal 2026 de Chascomús.
        Detalla qué acciones están previstas financiar y si existen metas cuantitativas comprometidas (Formulario 5).
        """
    elif tipo in ["actividad", "obra", "proyecto"]:
        prompt_explicacion = f"""
        Explica la finalidad del proyecto/obra/actividad física: {camino_str} (Código {codigo}) del Programa {prog_cod} (Jurisdicción {jur_cod}) en el presupuesto 2026 de Chascomús.
        Detalla cuál es su programación física o financiera, presupuesto asignado o ubicación (Barrio) si se describe.
        """
    elif tipo == "partida":
        prompt_explicacion = f"""
        Explica brevemente a qué tipo de gastos se refiere la partida por objeto del gasto de RAFAM: {codigo} ({detalles.get('nombre')}) y cómo se aplica habitualmente en la administración pública municipal.
        """
    elif tipo == "recurso":
        prompt_explicacion = f"""
        Explica la procedencia y naturaleza del recurso tributario/tasa de ingresos: {codigo} ({detalles.get('nombre')}) en el presupuesto municipal 2026 de Chascomús.
        Menciona de dónde provienen estos fondos (tasas locales, coparticipación provincial, aportes nacionales, etc.).
        """
        
    # Forzar respuesta en idioma español
    prompt_explicacion = prompt_explicacion.strip() + "\n\nResponde obligatoriamente en idioma castellano (español). Bajo ninguna circunstancia respondas en inglés."
        
    # Ejecutar consulta en NotebookLM para traer la ficha narrativa en caliente
    print(f"Obteniendo narrativa en NotebookLM para {tipo} {codigo}...")
    cmd = ["nlm", "query", "notebook", NOTEBOOK_ID_2026, prompt_explicacion, "--timeout", "120"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0:
            narrativa_sucia = res.stdout
            detalles["descripcion_rag"] = limpiar_salida_caja_nlm(narrativa_sucia)
        else:
            detalles["descripcion_rag"] = f"No se pudo obtener información adicional de NotebookLM. Error CLI: {res.stderr}"
    except Exception as e:
         detalles["descripcion_rag"] = f"Error al llamar a NotebookLM: {str(e)}"
         
    return detalles

@app.post("/api/enrutamiento")
def post_enrutamiento(request: RouteRequest):
    """Analiza la consulta y devuelve los códigos contables de enrutamiento asignados."""
    res = traducir_consulta_contable(request.query)
    return res

@app.post("/api/query")
def post_query(request: QueryRequest):
    """
    Toma la pregunta del usuario, determina los códigos contables a asociar
    (del enrutamiento o del nodo del árbol seleccionado), enriquece el prompt
    y llama al endpoint del puente RAGCHAS actual (puerto 3001).
    """
    query_original = request.query
    contexto_manual = request.nodo_contexto
    
    enrutamiento = {}
    
    # 1. Si el usuario seleccionó un nodo en el árbol, usar ese contexto directamente
    if contexto_manual and contexto_manual.get("codigo"):
        tipo = contexto_manual.get("tipo")
        codigo = contexto_manual.get("codigo")
        prog_cod = contexto_manual.get("prog_cod")
        jur_cod = contexto_manual.get("jur_cod")
        
        # Mapear los campos del contexto manual al formato del enrutamiento
        if tipo == "jurisdiccion":
            enrutamiento["jurisdiccion_codigo"] = codigo
        elif tipo == "programa":
            enrutamiento["jurisdiccion_codigo"] = jur_cod
            enrutamiento["programa_codigo"] = codigo
        elif tipo in ["actividad", "obra", "proyecto"]:
            enrutamiento["jurisdiccion_codigo"] = jur_cod
            enrutamiento["programa_codigo"] = prog_cod
            # Las actividades u obras no tienen un clasificador único independiente de 10 dígitos, pero se inyecta su nombre
            enrutamiento["razon_enrutamiento"] = f"Foco en la actividad/obra código {codigo} ('{contexto_manual.get('nombre')}')"
        elif tipo == "partida":
            enrutamiento["partida_gasto_codigo"] = codigo
        elif tipo == "recurso":
            enrutamiento["recurso_rubro_codigo"] = codigo
            
        enrutamiento["razon_enrutamiento"] = enrutamiento.get("razon_enrutamiento", f"Foco manual establecido en el nodo {tipo} {codigo} del árbol.")
    else:
        # 2. Si no hay nodo seleccionado, traducir semánticamente la consulta
        print(f"Traduciendo semánticamente: '{query_original}'")
        enrutamiento = traducir_consulta_contable(query_original)
        
    # 3. Generar prompt enriquecido con las directrices contables
    prompt_enriquecido = generar_prompt_enriquecido(query_original, enrutamiento)
    
    print(f"\n[RAG RAFAM API] Prompt Enriquecido enviado a RAGCHAS:")
    print(prompt_enriquecido)
    print("---------------------------------------------")
    
    # 4. Enviar a RAGCHAS Bridge (puente.js en puerto 3001)
    payload = {
        "query": prompt_enriquecido,
        "length": request.length,
        "model": request.model
    }
    
    try:
        res = requests.post(RAGCHAS_API_URL, json=payload, timeout=300)
        if res.status_code != 200:
            raise HTTPException(
                status_code=res.status_code, 
                detail=f"Error retornado por RAGCHAS: {res.text}"
            )
        
        datos_respuesta = res.json()
        
        # Generar sugerencias de preguntas de seguimiento de forma inteligente usando Gemini 2.5 Flash
        sugeridas = []
        is_system_command = query_original.lower().find('ragchas') >= 0
        if request.active_module != 'estructura_rafam' and not is_system_command:
            client_gemini = obtener_cliente_gemini()
            if client_gemini:
                try:
                    prompt_sugerencias = f"""
                    Basándote en la siguiente pregunta del usuario y la respuesta provista por el Auditor RAG, genera exactamente 3 preguntas cortas de seguimiento (follow-up questions) en castellano que el usuario podría querer hacer a continuación.
                    Mantén las preguntas cortas (máximo 12 palabras cada una), enfocadas y relevantes para profundizar en el mismo tema o en aspectos directamente relacionados de la normativa o presupuesto.
                    Devuelve únicamente un objeto JSON con la estructura: {{"preguntas": ["pregunta 1", "pregunta 2", "pregunta 3"]}}. No agregues explicaciones ni markdown.

                    Pregunta del usuario: {query_original}
                    Respuesta del RAG: {datos_respuesta.get("respuesta", "")}
                    """
                    
                    resp_sugerencias = client_gemini.models.generate_content(
                        model=MODELO_SELECCIONADO,
                        contents=prompt_sugerencias,
                        config={"response_mime_type": "application/json"}
                    )
                    res_json = json.loads(resp_sugerencias.text.strip())
                    sugeridas = res_json.get("preguntas", [])
                except Exception as e:
                    print(f"⚠️ Error al generar preguntas sugeridas con Gemini: {e}", file=sys.stderr)
        
        # Devolver respuesta e incluir los metadatos de enrutamiento para que el Front-end
        # pueda graficar o actualizar el árbol contable según lo que respondió el bot
        return {
            "respuesta": datos_respuesta.get("respuesta", "Sin respuesta"),
            "grafico": datos_respuesta.get("grafico", ""),
            "enrutamiento": enrutamiento,
            "prompt_enriquecido": prompt_enriquecido,
            "sugeridas": sugeridas
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"No se pudo conectar con el servidor RAGCHAS en {RAGCHAS_API_URL}. ¿Está encendido iniciar_sistema.bat? Detalle: {str(e)}"
        )

@app.post("/api/sincronizar")
def post_sincronizar(background_tasks: BackgroundTasks):
    """Encola la tarea de sincronización contable desde NotebookLM en segundo plano."""
    background_tasks.add_task(tarea_sincronizar)
    return {"status": "sincronizando", "mensaje": "La sincronización se está ejecutando de fondo. Demorará unos minutos."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
