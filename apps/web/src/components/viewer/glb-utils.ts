// DB model_node_name -> real object name inside public/models/campus.glb.
// Keys come in two forms:
//   1. Convenience aliases kept for backwards-compat (e.g. "Edificio_C")
//   2. Exact model_node_name values set via migration SQL
// Values must match the exact node name inside the current campus.glb export.
export const DB_TO_GLB_NAME: Record<string, string> = {
  // ── Biblioteca / Centro de Información ─────────────────────────────────
  Biblioteca_: "Biblioteca_Biblioteca",
  Centro_Computo: "Centro de Computo",

  // ── Edificio X ─────────────────────────────────────────────────────────
  Edificio_X: "EdificioX",
  Edificio_X001: "EdificioX",

  // ── Edificio C ─────────────────────────────────────────────────────────
  Edificio_C: "Eduficio C",
  Eduficio_C: "Eduficio C",

  // ── Edificios de aulas A–K, L, Q, Nuevo ────────────────────────────────
  Edificio_A: "Edificio A ",
  Edificio_B: "Edificio B",
  Edificio_E: "Edificio E_Edificio E",
  Edificio_F: "Edificio F",
  Edificio_G: "Edificio G_Edificio G",
  Edificio_H: "Edificio H_Edifucui H",
  Edificio_I: "Edificio I",
  Edificio_J: "Edificio J",
  Edificio_K: "Edificio K",
  Edificio_L: "Edificio  L ",
  Edificio__L_: "Edificio  L ",
  Edificio_Q: "Edificio Q_Edificio Q",
  Edificio_Nuevo: "Edificio Nuevo",

  // ── Aulas Ñ ────────────────────────────────────────────────────────────
  Aulas_ENIE: "Aulas Ñ",
  Aulas_N: "Aulas Ñ",
  "aula-n": "Aulas Ñ",
  "Aulas_Ñ": "Aulas Ñ",

  // ── Aulas P / S / K / D ────────────────────────────────────────────────
  Aulas_P: "Aulas P ",
  Aulas_S: "Aulas S.",
  Aulas_D: "Aulas D ",
  Aulas_K: "Aulas K",
  Aulas_Doctorado: "Aulas y Cubiculos de Doctorado",

  // ── Laboratorio de Química ──────────────────────────────────────────────
  Laboratorio_Quimica: "Laboratorio de ing.  Quimica",
  Laboratorio_de_Ing__Quimica: "Laboratorio de ing.  Quimica",
  Laboratorio_de_ing__Quimica: "Laboratorio de ing.  Quimica",

  // ── Laboratorio Civil ───────────────────────────────────────────────────
  Laboratorio_Civil: "Laboratorio de Ing. Civil",
  Laboratorio_de_Ing_Civil001: "Laboratorio de Ing. Civil",

  // ── Laboratorio Eléctrica ───────────────────────────────────────────────
  Laboratorio_Electrica: "Edificios 3D 12 en emplazamiento plano",
  Edificios_3D_12_en_emplazamiento_plano: "Edificios 3D 12 en emplazamiento plano",
  Laboratorio_Ing_Electrica: "Laboratorio de Ing.Electrica ",

  // ── Lab Físico-Química ──────────────────────────────────────────────────
  Fisico_Quimica: "Laboratorio de Fisico-quimica ",
  Edificios_3D_3_en_emplazamiento_plano: "Laboratorio de Fisico-quimica ",

  // ── Sala de Titulación / Lab. Microscopía ───────────────────────────────
  Sala_Titulacion: "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ",
  Edificios_3D_6_en_emplazamiento_plano: "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ",
  Laboratorio_Microscopia: "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ",

  // ── Laboratorio Industrial ──────────────────────────────────────────────
  Laboratorio_Industrial: "Laboratorio de Ing. Idustrial",

  // ── Laboratorio Mecánica / Química Pesada (mesh compartido) ────────────
  Laboratorio_Mecanica: "Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ",
  Laboratorio_Quimica_Pesada: "Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ",

  // ── Lab. de Simulación ─────────────────────────────────────────────────
  Lab_Simulacion: "Lab de Simulacion ",

  // ── Posgrado ────────────────────────────────────────────────────────────
  Posgrado: "Edificio de Postgrado.001",
  Edificio_de_Postgrado001: "Edificio de Postgrado.001",

  // ── Departamentos ───────────────────────────────────────────────────────
  Depto_Quimica_Bioquimica: "DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA",
  "DEPARTAMENTO_DE_INGENIERÍA_QUÍMICA_Y_BIOQUÍMICA": "DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA",

  // DQI-DII: mesh distinto al de DQB (incluye "DEPTO. de ing Industrial")
  Depto_Ing_Quimica_Industrial: "DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial ",

  Depto_Electronica: "DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA",
  "DEPARTAMENTO_DE_INGENIERÍA_ELECTRÓNICA": "DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA",

  Departamento_Ciencias_Basicas: "Departamento de Ciencias Basicas_Departamento de Ciencias Basicas",
  Departamento_de_Ciencias_Basicas_Departamento_de_Ciencias_Basicas: "Departamento de Ciencias Basicas_Departamento de Ciencias Basicas",

  Departamento_Desarrollo_Academico: "DEPTO, de desarrolo academico ",
  Departamento_Ciencias_Economico_Administrativas: "Aulas J. Dep de Economico Administravita ",

  Depto_Ciencias_Tierra: "Depto de ceiencias de la Tierra ",

  // ── Cubículos ───────────────────────────────────────────────────────────
  "cubiculo-maestros": "Cubiculo de Maestros",
  Cubiculo_Maestros: "Cubiculo de Maestros",
  Cubiculo_de_Maestros: "Cubiculo de Maestros",

  Cubiculos_Doctorado: "Cubiculos de Doctorado.001",
  Cubiculos_de_Doctorado001: "Cubiculos de Doctorado.001",

  // ── Audiovisual ─────────────────────────────────────────────────────────
  Audiovisual_Posgrado: "Audiovisual de Postgrado.001",
  Audiovisual_de_Postgrado001: "Audiovisual de Postgrado.001",
  Audiovisual_Ingenieria: "Audiovisual de Ing ",
  Audiovisual_Licenciatura: "Audiovisual de\nLicenciatura",

  // ── DEPI / CONACYT ──────────────────────────────────────────────────────
  Depi: "D.E.P.I.",
  Conacyt: "Edificio CONACYT",

  // ── Gimnasio ────────────────────────────────────────────────────────────
  Gimnasio: "Gimnasio_Gimnasio",
  Gimnacio_: "Gimnasio_Gimnasio",

  // ── Cafetería / Caldera / Extraescolares ────────────────────────────────
  Cafeteria: "Cafeteria",
  Caldera: "Caldera ",
  Servicios_Extra_Escolares: "Extra escolares ",

  // ── Maestrías ───────────────────────────────────────────────────────────
  Maestria_Administracion: "Maestria en Administracion",
  Maestria_en_Administracion: "Maestria en Administracion",
  "maestria-administracion": "Maestria en Administracion",
  Maestria_En_Construccion: "Maestria en construccion",
  Maestria_Doctorado: "Maestri en docencia y sala de educacion a distancia ",

  // ── Ludoteca / Sección 61 ───────────────────────────────────────────────
  Caseta_Vigilancia: "seccion 61",
  Ludoteca: "seccion 61",

  // ── Dirección / Servicios Escolares (mesh compartido) ───────────────────
  Edificio_Direccion: "Direccion, Depto de servicios escolares, Div de estudios profecionales ",
  Asesorias: "Asesorias",

  // ── Geolocalización ─────────────────────────────────────────────────────
  Geolocalizacion: "Contenido de geolocalización",
  Contenido_de_geolocalización: "Contenido de geolocalización",
};

export function resolveGlbName(modelNodeName: string): string {
  return DB_TO_GLB_NAME[modelNodeName] ?? modelNodeName;
}
