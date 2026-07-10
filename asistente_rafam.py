import os
import sys
import json
import sqlite3
import re
from datetime import datetime
from dotenv import load_dotenv

# Asegurar encoding UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Importar SDK de Google GenAI
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATOS_DIR = os.path.join(BASE_DIR, "datos")
DB_PATH = os.path.join(DATOS_DIR, "rafam_db.sqlite")
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Cargar .env propio o el de RAGCHAS si no existe
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv(dotenv_path="C:\\Gustavo\\App Presupuesto Municipal\\.env")

MODELO_SELECCIONADO = 'gemini-2.5-flash'

def obtener_cliente_gemini():
    """Inicializa y devuelve el cliente de Gemini."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("⚠️ Advertencia: No se encontró la variable GEMINI_API_KEY. Traducción semántica desactivada.", file=sys.stderr)
        return None
    if GENAI_AVAILABLE:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"❌ Error al inicializar cliente de Gemini: {e}", file=sys.stderr)
    return None

def obtener_catalogo_contable():
    """Lee toda la estructura contable de SQLite y genera un catálogo textual compacto."""
    if not os.path.exists(DB_PATH):
        return ""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Obtener Jurisdicciones
    cursor.execute("SELECT codigo, nombre FROM jurisdicciones;")
    jurisdicciones = cursor.fetchall()
    
    # 2. Obtener Programas
    cursor.execute("SELECT codigo, nombre, jurisdiccion_codigo FROM programas;")
    programas = cursor.fetchall()
    
    # 3. Obtener Partidas de Gasto principales
    cursor.execute("SELECT codigo, nombre FROM partidas_gasto WHERE codigo LIKE '%.0.0' OR codigo NOT LIKE '%.%.%';")
    partidas = cursor.fetchall()
    
    # 4. Obtener Recursos principales
    cursor.execute("SELECT codigo, nombre FROM recursos_rubro LIMIT 30;")
    recursos = cursor.fetchall()
    
    conn.close()
    
    # Formatear catálogo
    output = "=== JURISDICCIONES (SECRETARIAS) ===\n"
    for cod, nom in jurisdicciones:
        output += f"- Código: {cod} | Nombre: {nom}\n"
        
    output += "\n=== PROGRAMAS PRESUPUESTARIOS ===\n"
    for cod, nom, jur_cod in programas:
        output += f"- Código Programa: {cod} | Nombre: {nom} | Pertenece a Jurisdicción: {jur_cod}\n"
        
    output += "\n=== PARTIDAS DE GASTO PRINCIPALES ===\n"
    for cod, nom in partidas:
        output += f"- Partida: {cod} | Nombre: {nom}\n"
        
    output += "\n=== RECURSOS Y TASAS MUNICIPALES ===\n"
    for cod, nom in recursos:
        output += f"- Recurso/Tasa: {cod} | Nombre: {nom}\n"
        
    return output

def traducir_consulta_contable(query):
    """Usa Gemini para mapear una consulta en lenguaje natural a códigos contables RAFAM."""
    client = obtener_cliente_gemini()
    if not client:
        return {"error": "API Key de Gemini no configurada."}
        
    catalogo = obtener_catalogo_contable()
    if not catalogo:
        return {"error": "La base de datos de estructura no está sincronizada. Corre primero sincronizar_estructura.py"}
        
    prompt = f"""
    Eres el motor de traducción contable de RAG RAFAM. Tu tarea es analizar la consulta del usuario en lenguaje natural y mapearla a los códigos oficiales del presupuesto municipal.
    
    A continuación se presenta el catálogo oficial de códigos presupuestarios de la municipalidad:
    
    {catalogo}
    
    Consulta del usuario: "{query}"
    
    Analiza la consulta e identifica los códigos de Jurisdicción, Programa, Partida de Gasto u Objeto de Recurso que estén involucrados de manera directa.
    
    Devuelve estrictamente un objeto JSON con el siguiente formato, sin markdown de triple comilla (```json) y sin explicaciones adicionales:
    {{
      "jurisdiccion_codigo": "código de 10 dígitos o null",
      "programa_codigo": "código de programa o null",
      "partida_gasto_codigo": "código de partida o null",
      "recurso_rubro_codigo": "código de recurso o null",
      "razon_enrutamiento": "breve explicación técnica del por qué elegiste estos códigos contables"
    }}
    """
    try:
        response = client.models.generate_content(
            model=MODELO_SELECCIONADO,
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"⚠️ Error en traducción semántica: {e}", file=sys.stderr)
        return {"error": str(e)}

def obtener_detalles_nodo(tipo, codigo, prog_cod=None, jur_cod=None):
    """Consulta SQLite para obtener el nombre oficial y datos de la jerarquía de un nodo."""
    if not os.path.exists(DB_PATH):
        return None
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    detalles = {}
    
    if tipo == "jurisdiccion":
        cursor.execute("SELECT codigo, nombre FROM jurisdicciones WHERE codigo = ?;", (codigo,))
        row = cursor.fetchone()
        if row:
            detalles = {"tipo": "jurisdiccion", "codigo": row[0], "nombre": row[1], "camino": [row[1]]}
            # Obtener subprogramas
            cursor.execute("SELECT codigo, nombre FROM programas WHERE jurisdiccion_codigo = ?;", (codigo,))
            detalles["hijos"] = [{"codigo": r[0], "nombre": r[1], "tipo": "programa"} for r in cursor.fetchall()]
            
    elif tipo == "programa":
        cursor.execute("SELECT codigo, nombre, jurisdiccion_codigo FROM programas WHERE codigo = ? AND jurisdiccion_codigo = ?;", (codigo, jur_cod))
        row = cursor.fetchone()
        if row:
            cursor.execute("SELECT nombre FROM jurisdicciones WHERE codigo = ?;", (row[2],))
            jur_nombre = cursor.fetchone()[0]
            detalles = {
                "tipo": "programa",
                "codigo": row[0],
                "nombre": row[1],
                "jurisdiccion_codigo": row[2],
                "jurisdiccion_nombre": jur_nombre,
                "camino": [jur_nombre, row[1]]
            }
            # Obtener actividades u obras
            cursor.execute("SELECT codigo, nombre, tipo FROM actividades_proyectos WHERE programa_codigo = ? AND jurisdiccion_codigo = ?;", (codigo, jur_cod))
            detalles["hijos"] = [{"codigo": r[0], "nombre": r[1], "tipo": r[2].lower()} for r in cursor.fetchall()]
            
    elif tipo == "actividad" or tipo == "obra" or tipo == "proyecto":
        cursor.execute("SELECT AP.codigo, AP.nombre, AP.programa_codigo, AP.jurisdiccion_codigo, P.nombre, J.nombre, AP.tipo "
                       "FROM actividades_proyectos AP "
                       "JOIN programas P ON AP.programa_codigo = P.codigo AND AP.jurisdiccion_codigo = P.jurisdiccion_codigo "
                       "JOIN jurisdicciones J ON AP.jurisdiccion_codigo = J.codigo "
                       "WHERE AP.codigo = ? AND AP.programa_codigo = ? AND AP.jurisdiccion_codigo = ?;", (codigo, prog_cod, jur_cod))
        row = cursor.fetchone()
        if row:
            detalles = {
                "tipo": row[6].lower(),
                "codigo": row[0],
                "nombre": row[1],
                "programa_codigo": row[2],
                "programa_nombre": row[4],
                "jurisdiccion_codigo": row[3],
                "jurisdiccion_nombre": row[5],
                "camino": [row[5], row[4], row[1]]
            }
            
    elif tipo == "partida":
        cursor.execute("SELECT codigo, nombre, inciso FROM partidas_gasto WHERE codigo = ?;", (codigo,))
        row = cursor.fetchone()
        if row:
            detalles = {
                "tipo": "partida_gasto",
                "codigo": row[0],
                "nombre": row[1],
                "inciso": row[2],
                "camino": [f"Inciso {row[2]}", row[1]]
            }
            
    elif tipo == "recurso":
        cursor.execute("SELECT codigo, nombre, clase, concepto FROM recursos_rubro WHERE codigo = ?;", (codigo,))
        row = cursor.fetchone()
        if row:
            detalles = {
                "tipo": "recurso_rubro",
                "codigo": row[0],
                "nombre": row[1],
                "clase": row[2],
                "concepto": row[3],
                "camino": [f"Clase {row[2]}", row[1]]
            }
            
    conn.close()
    return detalles

def generar_prompt_enriquecido(query, enrutamiento):
    """Construye la directiva de contexto contable para NotebookLM."""
    directivas = []
    
    jur_cod = enrutamiento.get("jurisdiccion_codigo")
    prog_cod = enrutamiento.get("programa_codigo")
    partida_cod = enrutamiento.get("partida_gasto_codigo")
    recurso_cod = enrutamiento.get("recurso_rubro_codigo")
    
    if jur_cod:
        directivas.append(f"Jurisdicción/Secretaría: {jur_cod}")
    if prog_cod:
        directivas.append(f"Programa Presupuestario: {prog_cod}")
    if partida_cod:
        directivas.append(f"Partida de Gasto por Objeto: {partida_cod}")
    if recurso_cod:
        directivas.append(f"Recurso o Tasa por Rubro: {recurso_cod}")
        
    if not directivas:
        return query
        
    contexto = ", ".join(directivas)
    razon = enrutamiento.get("razon_enrutamiento", "Filtrado automático por coherencia contable.")
    
    prompt_final = f"""{query}

[DIRECTIVA DE CONTROL CONTABLE RAG RAFAM]
Para responder de forma correcta y precisa, debes buscar prioritariamente la información y montos que correspondan exactamente a los siguientes clasificadores presupuestarios de RAFAM:
- {contexto}
- Justificación: {razon}
Asegúrate de no mezclar estas cifras con las de otras jurisdicciones o programas del presupuesto municipal de Chascomús 2026.
"""
    return prompt_final.strip()

def principal():
    import argparse
    parser = argparse.ArgumentParser(description="Enrutador Contable - RAG RAFAM")
    parser.add_argument("--query", "-q", type=str, help="Analiza y enruta una consulta de lenguaje natural")
    parser.add_argument("--details", "-d", type=str, nargs="+", help="Obtiene los detalles de un nodo (ej: -d jurisdiccion 1110119000)")
    args = parser.parse_args()
    
    if args.query:
        query = args.query.strip()
        print(f"Analizando consulta: '{query}'")
        res = traducir_consulta_contable(query)
        print("\n=== ENRUTAMIENTO CONTABLE DETECTADO ===")
        print(json.dumps(res, indent=2, ensure_ascii=False))
        
        prompt_enriquecido = generar_prompt_enriquecido(query, res)
        print("\n=== PROMPT ENRIQUECIDO PARA RAGCHAS ===")
        print(prompt_enriquecido)
        
    elif args.details:
        if len(args.details) < 2:
            print("Error: Debes especificar tipo y código. Ej: -d jurisdiccion 1110119000")
            sys.exit(1)
        tipo = args.details[0].lower()
        codigo = args.details[1]
        
        prog_cod = args.details[2] if len(args.details) > 2 else None
        jur_cod = args.details[3] if len(args.details) > 3 else None
        
        detalles = obtener_detalles_nodo(tipo, codigo, prog_cod, jur_cod)
        print(json.dumps(detalles, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    principal()
