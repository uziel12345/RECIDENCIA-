// DB model_node_name -> real object name inside public/models/campus.glb.
// Keep these names aligned with the GLB export; labels use them to sit on top
// of the actual mesh instead of falling back to approximate coordinates.
export const DB_TO_GLB_NAME: Record<string, string> = {
  Biblioteca_: "Biblioteca_Biblioteca",

  Centro_Computo: "Centro_de_Computo001",

  Edificio_X: "EdificioX",
  Edificio_X001: "EdificioX",
  Edificio_C: "Eduficio_C",
  Edificio_E: "Edificio_E_Edificio_E",
  Edificio_G: "Edificio_G_Edificio_G",
  Edificio_L: "Edificio__L_",
  Edificio_Q: "Edificio_Q_Edificio_Q",
  Edificio_Nuevo: "Edificio_Nuevo",

  Aulas_ENIE: "Aulas_Ñ",
  Aulas_N: "Aulas_Ñ",
  "aula-n": "Aulas_Ñ",
  Aula_1007: "Edificio_3D_1007",
  Aula_1008: "Edificio_3D_1008",
  Aula_1009: "Edificio_3D_1009",

  Laboratorio_Quimica: "Laboratorio_de_ing__Quimica",
  Laboratorio_de_Ing__Quimica: "Laboratorio_de_ing__Quimica",
  Laboratorio_Civil: "Laboratorio_de_Ing_Civil001",
  Laboratorio_Electrica: "Edificios_3D_12_en_emplazamiento_plano",
  Fisico_Quimica: "Edificios_3D_3_en_emplazamiento_plano",
  Sala_Titulacion: "Edificios_3D_6_en_emplazamiento_plano",
  Laboratorio_Industrial: "Laboratorio_de_Ing_Idustrial",

  Posgrado: "Edificio_de_Postgrado001",

  Depto_Quimica_Bioquimica: "DEPARTAMENTO_DE_INGENIERÍA_QUÍMICA_Y_BIOQUÍMICA",
  Depto_Electronica: "DEPARTAMENTO_DE_INGENIERÍA_ELECTRÓNICA",
  Departamento_Ciencias_Basicas:
    "Departamento_de_Ciencias_Basicas_Departamento_de_Ciencias_Basicas",
  "cubiculo-maestros": "Cubiculo_de_Maestros",

  Audiovisual_Posgrado: "Audiovisual_de_Postgrado001",
  Cubiculo_Maestros: "Cubiculo_de_Maestros",
  Cubiculos_Doctorado: "Cubiculos_de_Doctorado001",
  Gimnasio: "Gimnasio_Gimnasio",
  Gimnacio_: "Gimnasio_Gimnasio",

  Maestria_Administracion: "Maestria_en_Administracion",
  "maestria-administracion": "Maestria_en_Administracion",
  Geolocalizacion: "Contenido_de_geolocalización",
};

export function resolveGlbName(modelNodeName: string): string {
  return DB_TO_GLB_NAME[modelNodeName] ?? modelNodeName;
}
