import bpy

# ============================================================
# Script 3 — Posicionamiento de edificios del campus ITO
# Ejecutar en Blender > Scripting tab
#
# Fórmula:  Blender X = campus_x
#           Blender Y = -campus_z
#           Blender Z = 0  (piso)
#
# Fuente: campusNodes.ts  (nodos n-acceso-*)
# ============================================================

POSITIONS = {
    # ── EDIFICIOS CON NODO DE ACCESO DEFINIDO ──────────────────
    "Biblioteca_":                      (   8,    0,  0),
    "Asesorias001":                     (  12,    4,  0),   # z=-4  → Y=+4
    "Cafeteria":                        (  22,  -58,  0),
    "Gimnacio_":                        (  56,  -18,  0),
    "Direccion_":                       ( -78,  -50,  0),
    "Edificio_E":                       (  10,  -86,  0),
    "Edificio_F_":                      (   8, -118,  0),
    "Edificio_G":                       (   8, -148,  0),
    "Edificio_H":                       ( -38, -108,  0),
    "Edificio_I":                       ( -54, -162,  0),
    "Edificio_J_1":                     ( -35, -162,  0),
    "Edificio_K":                       (  46, -148,  0),
    "Edificio_Q":                       (  58,  -74,  0),
    "Edificio_B":                       ( -52,   48,  0),   # z=-48 → Y=+48
    "Eduficio_C":                       ( -58,   14,  0),   # z=-14 → Y=+14
    "Edificio__L_":                     (  22,   18,  0),   # z=-18 → Y=+18
    "EdificioXX":                       (  46,   14,  0),   # Edificio X  — z=-14 → Y=+14
    "EdificioX001":                     (   8,   54,  0),   # Edificio X001 — z=-54 → Y=+54
    "Edificio_Nuevo_1":                 ( -58, -150,  0),
    "Edificio_de_Postgrado":            ( -78,   92,  0),   # z=-92 → Y=+92
    "Aulas_S":                          (  62, -160,  0),
    "Aulas_Ñ001":                  (  54,  107,  0),   # Aulas Ñ — z=-107 → Y=+107
    "Centro_de_Computo":                (   2,  112,  0),   # z=-112 → Y=+112
    "Audiovisual_de_Licenciatura":      ( -40,   -5,  0),
    "Audiovisual_de_Postgrado":         (  70,  116,  0),   # z=-116 → Y=+116
    "Laboratorio_de_Fisico-quimica_":   ( -22,   18,  0),   # z=-18 → Y=+18
    "Laboratorio_de_Ing_Idustrial_1":   (  72, -112,  0),
    "Laboratorio_de_Ingh_Quimica001":   ( -44,   82,  0),   # z=-82 → Y=+82
    "Laboratorio_de_Ing_Civil":         (  20,   95,  0),   # z=-95 → Y=+95
    "Cubiculos_de_Doctorado":           (  32,  124,  0),   # z=-124 → Y=+124
    "Sala_de_titulacion-_aula_de_dibujo-_Lab_de_microscopia_": ( -94, 44, 0),  # z=-44 → Y=+44
    "Geom3D_Edificio_3D_1007":          (-128,    8,  0),   # z=-8  → Y=+8
    "Geom3D_Edificio_3D_1008":          (-158,   44,  0),   # z=-44 → Y=+44
    "Geom3D_Edificio_3D_1009":          (-114,   90,  0),   # z=-90 → Y=+90
    "Geom3D_Contenido_de_geolocalización": (-148, 62, 0),  # z=-62 → Y=+62
    "Geom3D_DEPARTAMENTO_DE_INGENIERÍA_QUÍMICA_Y_BIOQUÍMICA": (26, 127, 0),
    "DEPARTAMENTO_DE_INGENIERÍA_ELECTRÓNICA001": (54, 50, 0),  # z=-50 → Y=+50
    "Suelo_Campus":                     (   0,    0,  0),

    # ── SIN NODO DEFINIDO — POSICIÓN ESTIMADA ──────────────────
    # Revisar visualmente y ajustar si la posición es incorrecta
    "Geom3D_Edificio_3D_1":             (   0,  -20,  0),   # ESTIMAR — Ciencias Basicas
    "Geom3D021":                        ( -20,  -30,  0),   # ESTIMAR
    "Geom3D_Cubiculo_de_Maestros":      ( -70,  -40,  0),   # ESTIMAR — cerca de Dirección
}

found, not_found = [], []

for name, pos in POSITIONS.items():
    obj = bpy.data.objects.get(name)
    if obj:
        obj.location = pos
        found.append((name, pos))
    else:
        not_found.append(name)

print("\n" + "=" * 62)
print("  Script 3 — Posicionamiento completado")
print("=" * 62)
print(f"\n✅  Posicionados ({len(found)}):")
for name, (x, y, _) in found:
    print(f"   {name:<58} ({x:>6}, {y:>6})")

if not_found:
    print(f"\n⚠️   No encontrados en escena ({len(not_found)}):")
    for name in not_found:
        print(f"   {name}")

print()
print("Edificios marcados ESTIMAR → verificar visualmente:")
print("   Geom3D_Edificio_3D_1, Geom3D021, Geom3D_Cubiculo_de_Maestros")
print()
print("Cuando todo esté bien → corre el Script 4 y exporta el GLB.")
