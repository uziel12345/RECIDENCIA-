// DB model_node_name -> real object name inside public/models/campus.glb.
// Keys cover every historical format stored in the DB:
//   - space-separated ("Edificio B"), underscore ("Edificio_B"), typos, trailing spaces, \n literals.
// Values must match the exact node name inside the current campus.glb export.
export const DB_TO_GLB_NAME: Record<string, string> = {
  // ── Edificios A–S ──────────────────────────────────────────────────────────
  "Edificio A": "Edificio_A",
  "Edificio A ": "Edificio_A",
  Edificio_A: "Edificio_A",

  "Edificio B": "Edificio_B",
  Edificio_B: "Edificio_B",

  "Edificio C": "Edificio_C",
  Edificio_C: "Edificio_C",
  "Eduficio C": "Edificio_C",
  Eduficio_C: "Edificio_C",

  "Edificio E": "Edificio_E",
  Edificio_E: "Edificio_E",

  "Edificio F": "Edificio_F",
  Edificio_F: "Edificio_F",

  "Edificio G": "Edificio_G",
  "Edificio G_Edificio G": "Edificio_G",
  Edificio_G: "Edificio_G",

  "Edificio H": "Edificio_H_Servicio_Medico",
  "Edificio H_Edifucui H": "Edificio_H_Servicio_Medico",
  Edificio_H: "Edificio_H_Servicio_Medico",
  Edificio_H_Servicio_Medico: "Edificio_H_Servicio_Medico",

  "Edificio I": "Edificio_I",
  Edificio_I: "Edificio_I",

  "Edificio K": "Edificio_K",
  Edificio_K: "Edificio_K",

  "Edificio L": "Edificio_L",
  "Edificio  L": "Edificio_L",
  "Edificio  L ": "Edificio_L",
  Edificio_L: "Edificio_L",
  Edificio__L_: "Edificio_L",

  "Edificio Q": "Edificio_Q",
  "Edificio Q_Edificio Q": "Edificio_Q",
  Edificio_Q: "Edificio_Q",

  "Edificio S": "Edificio_S",
  "Aulas S.": "Edificio_S",
  Edificio_S: "Edificio_S",

  "Edificio Nuevo": "Edificio_Nuevo",
  Edificio_Nuevo: "Edificio_Nuevo",

  // ── CONACYT / DPI ──────────────────────────────────────────────────────────
  "Edificio CONACYT": "Edificio_Conacyt",
  Conacyt: "Edificio_Conacyt",
  Edificio_Conacyt: "Edificio_Conacyt",

  "D.E.P.I.": "D.P.I",
  Depi: "D.P.I",
  "D.P.I": "D.P.I",

  // ── Aulas ──────────────────────────────────────────────────────────────────
  "Aulas Ñ": "Aula_Ñ",
  "Aulas Ñ.001": "Aula_Ñ",
  Aulas_ENIE: "Aula_Ñ",
  Aulas_N: "Aula_Ñ",
  "aula-n": "Aula_Ñ",
  "Aulas_Ñ": "Aula_Ñ",

  "Aulas P": "Aula_P",
  "Aulas P ": "Aula_P",
  Aula_P: "Aula_P",
  Aulas_P: "Aula_P",

  Aula_O: "Aula_O",
  Aula_M: "Aula_M",
  Aula_AC: "Aula_AC",
  Aulas_M: "Aulas_M",

  "Aulas y Cubiculos de Doctorado": "Aulas_Cubiculos_de_Doctorado",
  Aulas_Doctorado: "Aulas_Cubiculos_de_Doctorado",
  Aulas_Cubiculos_de_Doctorado: "Aulas_Cubiculos_de_Doctorado",

  // ── Cubículos ───────────────────────────────────────────────────────────────
  "Cubiculo de Maestros": "Cubiculos_Maestros",
  "cubiculo-maestros": "Cubiculos_Maestros",
  Cubiculo_Maestros: "Cubiculos_Maestros",
  Cubiculo_de_Maestros: "Cubiculos_Maestros",
  Cubiculos_Maestros: "Cubiculos_Maestros",

  "Cubiculos de Doctorado.001": "Aulas_Cubiculos_de_Doctorado",
  Cubiculos_Doctorado: "Aulas_Cubiculos_de_Doctorado",
  Cubiculos_de_Doctorado001: "Aulas_Cubiculos_de_Doctorado",

  // ── Laboratorios ────────────────────────────────────────────────────────────
  "Laboratorio de Ing. Civil": "Lab_Ing_Civil",
  "Laboratorio de Ing. Civil ": "Lab_Ing_Civil",
  Laboratorio_Civil: "Lab_Ing_Civil",
  Laboratorio_de_Ing_Civil001: "Lab_Ing_Civil",
  Lab_Ing_Civil: "Lab_Ing_Civil",

  "Edificios 3D 12 en emplazamiento plano": "Lab_Ing_Electrica",
  Laboratorio_Electrica: "Lab_Ing_Electrica",
  Laboratorio_Ing_Electrica: "Lab_Ing_Electrica",
  Lab_Ing_Electrica: "Lab_Ing_Electrica",

  "Laboratorio de Fisico-quimica": "Laboratorio_Fisico_Quimica",
  "Laboratorio de Fisico-quimica ": "Laboratorio_Fisico_Quimica",
  "Laboratorio de ing.  Quimica": "Laboratorio_Fisico_Quimica",
  "Laboratorio de ing. Quimica": "Laboratorio_Fisico_Quimica",
  Fisico_Quimica: "Laboratorio_Fisico_Quimica",
  Laboratorio_Quimica: "Laboratorio_Fisico_Quimica",
  Laboratorio_de_Ing__Quimica: "Laboratorio_Fisico_Quimica",
  Laboratorio_de_ing__Quimica: "Laboratorio_Fisico_Quimica",
  "Edificios 3D 3 en emplazamiento plano": "Laboratorio_Fisico_Quimica",
  Edificios_3D_3_en_emplazamiento_plano: "Laboratorio_Fisico_Quimica",
  Laboratorio_Fisico_Quimica: "Laboratorio_Fisico_Quimica",

  "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ": "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo": "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  Sala_Titulacion: "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  Laboratorio_Microscopia: "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  "Edificios 3D 6 en emplazamiento plano": "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  Edificios_3D_6_en_emplazamiento_plano: "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",
  Lab_Microscopia_Sala_Titulacion_Aula_Dibujo: "Lab_Microscopia_Sala_Titulacion_Aula_Dibujo",

  "Laboratorio de Ing. Idustrial": "Laboratorio_Ing_Industrial",
  "Laboratorio de Ing. Industrial": "Laboratorio_Ing_Industrial",
  Laboratorio_Industrial: "Laboratorio_Ing_Industrial",
  Laboratorio_Ing_Industrial: "Laboratorio_Ing_Industrial",

  "Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ": "Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada",
  "Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica": "Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada",
  Laboratorio_Mecanica: "Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada",
  Laboratorio_Quimica_Pesada: "Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada",
  Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada: "Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada",

  "Lab de Simulacion": "Lab_Simulacion",
  "Lab de Simulacion ": "Lab_Simulacion",
  Lab_Simulacion: "Lab_Simulacion",

  // ── Departamentos ────────────────────────────────────────────────────────────
  "DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA": "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",
  "DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial ": "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",
  Depto_Quimica_Bioquimica: "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",
  Depto_Ing_Quimica_Industrial: "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",
  "DEPARTAMENTO_DE_INGENIERÍA_QUÍMICA_Y_BIOQUÍMICA": "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",
  Depto_Quimica_Bioquimica_Depto_Ing_Industrial: "Depto_Quimica_Bioquimica_Depto_Ing_Industrial",

  "DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA": "Edif y Depto de Ing. Electronica",
  Depto_Electronica: "Edif y Depto de Ing. Electronica",
  "DEPARTAMENTO_DE_INGENIERÍA_ELECTRÓNICA": "Edif y Depto de Ing. Electronica",
  "Edif y Depto de Ing. Electronica": "Edif y Depto de Ing. Electronica",

  "Departamento de Ciencias Basicas_Departamento de Ciencias Basicas": "Depto_Ciencias_Basicas",
  Departamento_Ciencias_Basicas: "Depto_Ciencias_Basicas",
  Departamento_de_Ciencias_Basicas_Departamento_de_Ciencias_Basicas: "Depto_Ciencias_Basicas",
  Depto_Ciencias_Basicas: "Depto_Ciencias_Basicas",

  "DEPTO, de desarrolo academico": "Depto_desarrollo_academico",
  "DEPTO, de desarrolo academico ": "Depto_desarrollo_academico",
  Departamento_Desarrollo_Academico: "Depto_desarrollo_academico",
  Depto_desarrollo_academico: "Depto_desarrollo_academico",

  "Aulas J. Dep de Economico Administravita": "Depto_ciencias_Economico_Admin",
  "Aulas J. Dep de Economico Administravita ": "Depto_ciencias_Economico_Admin",
  Departamento_Ciencias_Economico_Administrativas: "Depto_ciencias_Economico_Admin",
  Depto_ciencias_Economico_Admin: "Depto_ciencias_Economico_Admin",

  "Depto de ceiencias de la Tierra": "Depto_Ciencias_la_tierra",
  "Depto de ceiencias de la Tierra ": "Depto_Ciencias_la_tierra",
  Depto_Ciencias_Tierra: "Depto_Ciencias_la_tierra",
  Depto_Ciencias_la_tierra: "Depto_Ciencias_la_tierra",

  "Depto.Ing Electrica": "Depto_Ing_Electrica",
  Depto_Ing_Electrica: "Depto_Ing_Electrica",

  // ── Audiovisual ──────────────────────────────────────────────────────────────
  "Audiovisual de Ing": "Audiovisual_de_Ingeneria",
  "Audiovisual de Ing ": "Audiovisual_de_Ingeneria",
  "Audiovisual de Postgrado.001": "Audiovisual_de_Ingeneria",
  Audiovisual_Ingenieria: "Audiovisual_de_Ingeneria",
  Audiovisual_de_Postgrado001: "Audiovisual_de_Ingeneria",
  Audiovisual_Posgrado: "Audiovisual_de_Ingeneria",
  Audiovisual_de_Ingeneria: "Audiovisual_de_Ingeneria",

  "Audiovisual de\nLicenciatura": "Audiovisual_de_Lic",
  Audiovisual_Licenciatura: "Audiovisual_de_Lic",
  Audiovisual_de_Lic: "Audiovisual_de_Lic",

  // ── Maestrías ────────────────────────────────────────────────────────────────
  "Maestria en Administracion": "Maestria_Administracion",
  Maestria_Administracion: "Maestria_Administracion",
  Maestria_en_Administracion: "Maestria_Administracion",
  "maestria-administracion": "Maestria_Administracion",

  "Maestria en Administracion.001": "Sala_Titulacion_Maestria-Admon",
  Sala_Titulacion_Maestria_Admon: "Sala_Titulacion_Maestria-Admon",
  "Sala_Titulacion_Maestria-Admon": "Sala_Titulacion_Maestria-Admon",

  "Maestria en construccion": "Maestria_cosntruccion",
  Maestria_En_Construccion: "Maestria_cosntruccion",
  Maestria_cosntruccion: "Maestria_cosntruccion",

  "Maestri en docencia y sala de educacion a distancia": "Matria_Docencia_Sala_Educacion_distancia",
  "Maestri en docencia y sala de educacion a distancia ": "Matria_Docencia_Sala_Educacion_distancia",
  Maestria_Doctorado: "Matria_Docencia_Sala_Educacion_distancia",
  Matria_Docencia_Sala_Educacion_distancia: "Matria_Docencia_Sala_Educacion_distancia",

  // ── Dirección / Servicios escolares ─────────────────────────────────────────
  "Direccion, Depto de servicios escolares, Div de estudios profecionales ": "Depto_servico_escolares_Div_estudios_profecionales_Direccion",
  "Direccion, Depto de servicios escolares, Div de estudios profecionales": "Depto_servico_escolares_Div_estudios_profecionales_Direccion",
  Edificio_Direccion: "Depto_servico_escolares_Div_estudios_profecionales_Direccion",
  Depto_servico_escolares_Div_estudios_profecionales_Direccion:
    "Depto_servico_escolares_Div_estudios_profecionales_Direccion",

  // ── Centro de Información / Cómputo ─────────────────────────────────────────
  "Centro de Computo": "Centro_computo_Sistemas_Computacionales",
  Centro_Computo: "Centro_computo_Sistemas_Computacionales",
  Centro_computo_Sistemas_Computacionales: "Centro_computo_Sistemas_Computacionales",

  Centro_informacion: "Centro_informacion",

  // ── Cafetería / Caldera / Extraescolares ─────────────────────────────────────
  Cafeteria: "Cafeteria",
  Caldera: "Caldera",

  "Extra escolares": "Extra_escolares",
  "Extra escolares ": "Extra_escolares",
  Servicios_Extra_Escolares: "Extra_escolares",
  Extra_escolares: "Extra_escolares",

  // ── Gimnasio ──────────────────────────────────────────────────────────────────
  "Gimnasio_Gimnasio": "Gimnacio",
  Gimnasio: "Gimnacio",
  Gimnacio_: "Gimnacio",
  Gimnacio: "Gimnacio",

  // ── Sección 61 / Ludoteca ─────────────────────────────────────────────────────
  "seccion 61": "Seccion_61",
  Caseta_Vigilancia: "Seccion_61",
  Ludoteca: "Seccion_61",
  Seccion_61: "Seccion_61",

  // ── Asesorías / Bodega ────────────────────────────────────────────────────────
  Asesorias: "Asesorias",
  Bodega_1: "Bodega_1",
  Bodega_2: "Bodega_2",
};

export function resolveGlbName(modelNodeName: string): string {
  return DB_TO_GLB_NAME[modelNodeName] ?? modelNodeName;
}
