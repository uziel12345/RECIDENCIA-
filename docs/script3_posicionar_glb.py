"""
Script 3 — Posicionar edificios en campus.glb
Modifica el GLB directamente, sin necesidad de Blender.

Coordenadas: GLB [X, 0, Z] = campusNode.x, campusNode.z
(El sistema de coordenadas del GLB coincide con Three.js world space)

Uso:
    python docs/script3_posicionar_glb.py

Genera un backup automático (.bak) antes de modificar.
"""

import struct
import json
import os
import shutil

GLB_PATH = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "models", "campus.glb")
GLB_PATH = os.path.normpath(GLB_PATH)

# ── POSICIONES DEFINITIVAS ────────────────────────────────────────────────────
# Fuente: campusNodes.ts (nodos n-acceso-*)
# Formato: "NombreEnGLB": (campus_x, campus_z)
POSITIONS = {
    # ── CON NODO CAMPUSNODE EXPLÍCITO ─────────────────────────────────────────
    "Biblioteca":                        (   8,    0),
    "Asesorias":                         (  12,   -4),
    "Cafeteria":                         (  22,   58),
    "Gimnasio":                          (  56,   18),
    "Direccion":                         ( -78,   50),
    "Edificio_E":                        (  10,   86),
    "Edificio_F":                        (   8,  118),
    "Edificio_G":                        (   8,  148),
    "Edificio_H":                        ( -38,  108),
    "Edificio_I":                        ( -54,  162),
    "Edificio_J":                        ( -35,  162),
    "Edificio_K":                        (  46,  148),
    "Edificio_Q":                        (  58,   74),
    "Edificio_B":                        ( -52,  -48),
    "Edificio_C":                        ( -58,  -14),
    "Edificio_L":                        (  22,  -18),
    "Edificio_X":                        (   8,  -54),  # ed-edificiox001 → n-acceso-x001
    "Edificio_XX":                       (  46,  -14),  # ed-edificiox    → n-acceso-x
    "Edificio_Nuevo":                    ( -58,  150),
    "Edificio_Postgrado":                ( -78,  -92),
    "Aulas_S":                           (  62,  160),
    "Aulas_N":                           (  54, -107),  # Aulas Ñ
    "Centro_Computo":                    (   2, -112),
    "Audiovisual_Licenciatura":          ( -40,    5),
    "Audiovisual_Postgrado":             (  70, -116),
    "Laboratorio_Fisico_Quimica":        ( -22,  -18),
    "Laboratorio_Ing_Industrial":        (  72,  112),
    "Laboratorio_Ing_Quimica":           ( -44,  -82),
    "Laboratorio_Ing_Civil":             (  20,  -95),
    "Laboratorio_Ing_Electrica":         ( -72, -116),
    "Cubiculos_Doctorado":               (  32, -124),
    "Sala_Titulacion_Aula_Dibujo_Lab_Microscopia": ( -94,  -44),
    "Departamento_Ingenieria_Quimica_Bioquimica":  (  26, -127),
    "Departamento_Ingenieria_Electronica":         (  54,  -50),
    "Contenido_Geolocalizacion":         (-148,  -62),
    "Suelo_Campus":                      (   0,    0),

    # ── SIN NODO EXPLÍCITO — ESTIMAR ──────────────────────────────────────────
    # Verificar visualmente en el navegador y corregir si es necesario
    "Cubiculo_Maestros":                 ( -50,   25),   # entre Edificio C y Biblioteca
    "Departamento_Ciencias_Basicas":     (  82,   -4),   # este del campus, cerca Gimnasio
    "Departamento_Desarrollo_Academico": (   4,    2),   # junto a Biblioteca
    "Maestria_Administracion":           (  10,  178),   # sur del campus
    "Mantenimiento_Servicios_Generales_Ing_Electrica": (-128,   -8),  # n-acceso-1007
    "Maestria_En_Construccion":          (-158,  -44),   # n-acceso-1008
    "Departamento_Ciencias_Economico_Administrativas": (-114, -90),   # n-acceso-1009
}

ESTIMATED = {
    "Cubiculo_Maestros",
    "Departamento_Ciencias_Basicas",
    "Departamento_Desarrollo_Academico",
    "Maestria_Administracion",
    "Mantenimiento_Servicios_Generales_Ing_Electrica",
    "Maestria_En_Construccion",
    "Departamento_Ciencias_Economico_Administrativas",
}


def load_glb(path: str):
    with open(path, "rb") as f:
        data = f.read()
    magic, version, _ = struct.unpack("<III", data[:12])
    assert magic == 0x46546C67, "No es un archivo GLB válido"
    chunk0_len, chunk0_type = struct.unpack("<II", data[12:20])
    gltf = json.loads(data[20:20 + chunk0_len])
    bin_chunk = data[20 + chunk0_len:]
    return gltf, bin_chunk


def save_glb(path: str, gltf: dict, bin_chunk: bytes):
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    # Padding a múltiplos de 4 bytes (requerimiento glTF)
    while len(json_bytes) % 4:
        json_bytes += b" "
    chunk0 = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    total = 12 + len(chunk0) + len(bin_chunk)
    header = struct.pack("<III", 0x46546C67, 2, total)
    with open(path, "wb") as f:
        f.write(header + chunk0 + bin_chunk)
    return total


def main():
    if not os.path.exists(GLB_PATH):
        print(f"Error: no se encuentra el GLB en:\n  {GLB_PATH}")
        return

    # Backup
    bak_path = GLB_PATH + ".bak"
    shutil.copy2(GLB_PATH, bak_path)
    print(f"Backup: {os.path.basename(bak_path)}")

    gltf, bin_chunk = load_glb(GLB_PATH)
    nodes = gltf.get("nodes", [])

    positioned, estimated, not_in_script = [], [], []

    for node in nodes:
        name = node.get("name", "")
        if name in POSITIONS:
            x, z = POSITIONS[name]
            node["translation"] = [float(x), 0.0, float(z)]
            if name in ESTIMATED:
                estimated.append(name)
            else:
                positioned.append(name)
        else:
            not_in_script.append(name)

    new_size = save_glb(GLB_PATH, gltf, bin_chunk)

    # ── Reporte ───────────────────────────────────────────────────────────────
    print(f"\n{'='*64}")
    print(f"  Script 3 — campus.glb actualizado  ({new_size/1024:.1f} KB)")
    print(f"{'='*64}")

    print(f"\n[OK]  Posicionados con nodo exacto ({len(positioned)}):")
    for name in positioned:
        x, z = POSITIONS[name]
        print(f"   {name:<52} ({x:>5}, {z:>5})")

    if estimated:
        print(f"\n[ESTIMAR]  Posicionados aproximados - verificar en browser ({len(estimated)}):")
        for name in estimated:
            x, z = POSITIONS[name]
            print(f"   {name:<52} ({x:>5}, {z:>5})")

    if not_in_script:
        print(f"\n[NO MAPEADO]  Nombres en GLB sin posicion definida ({len(not_in_script)}):")
        for name in not_in_script:
            print(f"   {name}")

    total = len(positioned) + len(estimated) + len(not_in_script)
    print(f"\n   Total nodos en GLB : {total}")
    print(f"   Modificados        : {len(positioned) + len(estimated)}")
    print(f"   Sin modificar      : {len(not_in_script)}")
    print(f"\nVerifica los {len(estimated)} ESTIMADOS en el navegador.")
    print(f"Para revertir: copia {os.path.basename(bak_path)} => campus.glb")


if __name__ == "__main__":
    main()
