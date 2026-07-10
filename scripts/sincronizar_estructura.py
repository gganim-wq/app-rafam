import os
import sys
import json
import sqlite3
import subprocess
import re

# Asegurar encoding UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS_DIR = os.path.join(BASE_DIR, "datos")
DB_PATH = os.path.join(DATOS_DIR, "rafam_db.sqlite")
JSON_PATH = os.path.join(DATOS_DIR, "estructura_2026.json")

# Notebook ID para el Presupuesto 2026 de Chascomús
NOTEBOOK_ID_2026 = "1a068746-39ad-4129-b200-8df696c49e2e"

# Asegurar carpeta de datos
os.makedirs(DATOS_DIR, exist_ok=True)

def ejecutar_consulta_nlm(notebook_id, query):
    """Ejecuta una consulta RAG en NotebookLM vía CLI y retorna la respuesta limpia."""
    print(f"Consultando NotebookLM: '{query[:60]}...'")
    cmd = ["nlm", "query", "notebook", notebook_id, query, "--timeout", "300"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode != 0:
            print(f"⚠️ Error CLI: {res.stderr or res.stdout}", file=sys.stderr)
            return None
        return res.stdout
    except Exception as e:
        print(f"❌ Error al ejecutar nlm CLI: {e}", file=sys.stderr)
        return None

def limpiar_json_response(raw_text):
    """Extrae el bloque JSON de la respuesta de NotebookLM y lo limpia."""
    if not raw_text:
        return None
    
    # Si la salida es un JSON con 'answer', extraer el 'answer' primero
    try:
        data = json.loads(raw_text)
        if "answer" in data:
            raw_text = data["answer"]
    except json.JSONDecodeError:
        pass

    # Limpiar bordes de cajas ASCII de nlm
    lineas = raw_text.splitlines()
    cleaned_lines = []
    for line in lineas:
        l = line.strip()
        if l.startswith("│") and l.endswith("│"):
            cleaned_lines.append(line[1:-1].strip())
        elif l.startswith("╭") or l.startswith("╰"):
            continue
        else:
            cleaned_lines.append(line)
    raw_text = "\n".join(cleaned_lines)

    # Buscar bloque de código ```json o ``` y extraerlo
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw_text, re.DOTALL | re.IGNORECASE)
    if match:
        raw_text = match.group(1)
        
    raw_text = raw_text.strip()
    
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"⚠️ Error de parseo JSON: {e}")
        # Intentar una limpieza agresiva de caracteres extraños al inicio y fin
        match_json = re.search(r'(\{.*\}|\[.*\])', raw_text, re.DOTALL)
        if match_json:
            try:
                return json.loads(match_json.group(1))
            except json.JSONDecodeError:
                pass
        print(f"Contenido crudo fallido:\n{raw_text[:1000]}")
        return None

def inicializar_db():
    """Crea la estructura de tablas de la base de datos SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Habilitar claves foráneas
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Crear tablas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jurisdicciones (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS programas (
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        jurisdiccion_codigo TEXT NOT NULL,
        PRIMARY KEY (codigo, jurisdiccion_codigo),
        FOREIGN KEY (jurisdiccion_codigo) REFERENCES jurisdicciones(codigo) ON DELETE CASCADE
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS actividades_proyectos (
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        programa_codigo TEXT NOT NULL,
        jurisdiccion_codigo TEXT NOT NULL,
        tipo TEXT DEFAULT 'Actividad', -- 'Actividad' o 'Obra/Proyecto'
        PRIMARY KEY (codigo, programa_codigo, jurisdiccion_codigo),
        FOREIGN KEY (programa_codigo, jurisdiccion_codigo) REFERENCES programas(codigo, jurisdiccion_codigo) ON DELETE CASCADE
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS partidas_gasto (
        codigo TEXT PRIMARY KEY, -- ej: 2.1.1
        nombre TEXT NOT NULL,
        inciso TEXT NOT NULL -- ej: 2
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recursos_rubro (
        codigo TEXT PRIMARY KEY, -- ej: 11.2.01.12
        nombre TEXT NOT NULL,
        clase TEXT,
        concepto TEXT
    );
    """)
    
    conn.commit()
    conn.close()

def guardar_en_db(data):
    """Inserta la estructura sincronizada en la base de datos SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Limpiar datos existentes para evitar duplicados
    cursor.execute("DELETE FROM actividades_proyectos;")
    cursor.execute("DELETE FROM programas;")
    cursor.execute("DELETE FROM jurisdicciones;")
    cursor.execute("DELETE FROM partidas_gasto;")
    cursor.execute("DELETE FROM recursos_rubro;")
    
    # 1. Insertar Jurisdicciones
    for jur in data.get("jurisdicciones", []):
        cursor.execute("INSERT OR REPLACE INTO jurisdicciones (codigo, nombre) VALUES (?, ?);", 
                       (str(jur["codigo"]).strip(), str(jur["nombre"]).strip()))
    
    # 2. Insertar Programas y Actividades
    for prog in data.get("programas", []):
        j_cod = str(prog["jurisdiccion_codigo"]).strip()
        p_cod = str(prog["codigo"]).strip()
        p_nom = str(prog["nombre"]).strip()
        
        # Asegurar que la jurisdicción existe en la DB
        cursor.execute("INSERT OR IGNORE INTO jurisdicciones (codigo, nombre) VALUES (?, ?);", (j_cod, f"Jurisdicción {j_cod}"))
        
        cursor.execute("INSERT OR REPLACE INTO programas (codigo, nombre, jurisdiccion_codigo) VALUES (?, ?, ?);", 
                       (p_cod, p_nom, j_cod))
        
        for act in prog.get("actividades", []):
            a_cod = str(act["codigo"]).strip()
            a_nom = str(act["nombre"]).strip()
            # Determinar tipo
            tipo = "Obra/Proyecto" if any(k in a_nom.lower() for k in ["obra", "proyecto", "construccion", "repavimentacion", "construcción", "repavimentación"]) else "Actividad"
            cursor.execute("INSERT OR REPLACE INTO actividades_proyectos (codigo, nombre, programa_codigo, jurisdiccion_codigo, tipo) VALUES (?, ?, ?, ?, ?);", 
                           (a_cod, a_nom, p_cod, j_cod, tipo))
                           
    # 3. Insertar Partidas por Objeto del Gasto
    for part in data.get("gastos_objeto", []):
        cod = str(part["codigo"]).strip()
        nom = str(part["nombre"]).strip()
        # El inciso es el primer dígito del código
        inciso = cod[0] if cod else "0"
        cursor.execute("INSERT OR REPLACE INTO partidas_gasto (codigo, nombre, inciso) VALUES (?, ?, ?);", 
                       (cod, nom, inciso))
                       
    # 4. Insertar Recursos por Rubro
    for rec in data.get("recursos_rubro", []):
        cod = str(rec["codigo"]).strip()
        nom = str(rec["nombre"]).strip()
        # Intentar extraer clase y concepto del código de recurso (ej: 11.2.01.12)
        partes = cod.split('.')
        clase = partes[0] if len(partes) > 0 else None
        concepto = partes[1] if len(partes) > 1 else None
        cursor.execute("INSERT OR REPLACE INTO recursos_rubro (codigo, nombre, clase, concepto) VALUES (?, ?, ?, ?);", 
                       (cod, nom, clase, concepto))
                       
    conn.commit()
    conn.close()
    print("✅ Base de datos SQLite guardada y poblada correctamente.")

def sincronizar():
    print("🚀 Iniciando Sincronización del Presupuesto 2026...")
    
    # Consulta 1: Jurisdicciones
    query_jur = """
    Analiza el presupuesto de gastos 2026. Lista todas las Jurisdicciones municipales (Secretarías y dependencias principales) con sus códigos oficiales de 10 dígitos y nombres oficiales.
    Devuelve estrictamente un objeto JSON con este formato (sin markdown de triple comilla):
    {
      "jurisdicciones": [
        {"codigo": "1110119000", "nombre": "Secretaría de Obras Públicas"},
        {"codigo": "1110115000", "nombre": "Secretaría de Salud"}
      ]
    }
    """
    stdout_jur = ejecutar_consulta_nlm(NOTEBOOK_ID_2026, query_jur)
    jurisdicciones_data = limpiar_json_response(stdout_jur)
    
    if not jurisdicciones_data:
        print("❌ Error: No se pudieron extraer las jurisdicciones. Cancelando.")
        return
        
    print(f"✔ Jurisdicciones extraídas: {len(jurisdicciones_data.get('jurisdicciones', []))}")

    # Consulta 2: Programas y Actividades
    query_prog = """
    Analiza la Estructura Programática 2026 y el Formulario 4. Lista todos los programas presupuestarios vigentes especificando:
    1. El código de la Jurisdicción a la que pertenecen (ej: '1110119000').
    2. El código del Programa (ej: '16') y su nombre.
    3. Para cada programa, lista sus Actividades u Obras (Proyectos) detallando código y nombre.
    Devuelve estrictamente un objeto JSON con este formato (sin markdown de triple comilla):
    {
      "programas": [
        {
          "codigo": "16",
          "nombre": "Desarrollo Vial",
          "jurisdiccion_codigo": "1110119000",
          "actividades": [
             {"codigo": "01", "nombre": "Conservación de Caminos de Tierra"},
             {"codigo": "51", "nombre": "Repavimentación Barrio Jardín"}
          ]
        }
      ]
    }
    """
    stdout_prog = ejecutar_consulta_nlm(NOTEBOOK_ID_2026, query_prog)
    programas_data = limpiar_json_response(stdout_prog)
    
    if not programas_data:
        print("❌ Error: No se pudieron extraer los programas. Cancelando.")
        return
        
    print(f"✔ Programas extraídos: {len(programas_data.get('programas', []))}")

    # Consulta 3: Partidas por Objeto del Gasto
    query_gastos = """
    Analiza el clasificador de Gastos Por Objeto 2026. Lista los incisos (1 dígito) y las principales partidas (3 dígitos, ej: 2.1.1) con sus nombres oficiales.
    Devuelve estrictamente un objeto JSON con este formato (sin markdown de triple comilla):
    {
      "gastos_objeto": [
        {"codigo": "1.0.0", "nombre": "Gastos en Personal"},
        {"codigo": "2.0.0", "nombre": "Bienes de Consumo"},
        {"codigo": "2.1.1", "nombre": "Combustibles y Lubricantes"},
        {"codigo": "4.0.0", "nombre": "Bienes de Uso"}
      ]
    }
    """
    stdout_gastos = ejecutar_consulta_nlm(NOTEBOOK_ID_2026, query_gastos)
    gastos_data = limpiar_json_response(stdout_gastos)
    
    if not gastos_data:
        gastos_data = {"gastos_objeto": []}
        print("⚠️ Advertencia: No se pudieron extraer partidas de gastos por objeto. Continuando de todas formas.")
    else:
        print(f"✔ Partidas de gastos por objeto extraídas: {len(gastos_data.get('gastos_objeto', []))}")

    # Consulta 4: Recursos por Rubro
    query_recursos = """
    Analiza el documento de Recursos Por Rubro 2026. Lista las principales tasas, derechos, coparticipaciones y rubros de ingresos con sus códigos numéricos y nombres.
    Devuelve estrictamente un objeto JSON con este formato (sin markdown de triple comilla):
    {
      "recursos_rubro": [
        {"codigo": "11.2.01.01", "nombre": "Tasa por conservación de la vía pública"},
        {"codigo": "11.2.01.12", "nombre": "Tasa por servicios rurales"},
        {"codigo": "11.4.01.01", "nombre": "Derecho de construcción"}
      ]
    }
    """
    stdout_recursos = ejecutar_consulta_nlm(NOTEBOOK_ID_2026, query_recursos)
    recursos_data = limpiar_json_response(stdout_recursos)
    
    if not recursos_data:
        recursos_data = {"recursos_rubro": []}
        print("⚠️ Advertencia: No se pudieron extraer recursos por rubro. Continuando de todas formas.")
    else:
        print(f"✔ Recursos por rubro extraídos: {len(recursos_data.get('recursos_rubro', []))}")

    # Consolidar todo en un único JSON
    estructura_consolidada = {
        "año": 2026,
        "jurisdicciones": jurisdicciones_data.get("jurisdicciones", []),
        "programas": programas_data.get("programas", []),
        "gastos_objeto": gastos_data.get("gastos_objeto", []),
        "recursos_rubro": recursos_data.get("recursos_rubro", [])
    }
    
    # Guardar en archivo JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(estructura_consolidada, f, indent=2, ensure_ascii=False)
    print(f"✅ Archivo JSON guardado en: {JSON_PATH}")

    # Guardar en base de datos SQLite
    inicializar_db()
    guardar_en_db(estructura_consolidada)
    print("🎉 Sincronización finalizada con éxito.")

if __name__ == "__main__":
    sincronizar()
