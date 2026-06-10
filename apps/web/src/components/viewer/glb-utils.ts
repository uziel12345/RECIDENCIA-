// DB model_node_name → nombre real del mesh en el GLB
// (Script 1 limpió el GLB pero la BD conserva nombres distintos en algunos casos)
export const DB_TO_GLB_NAME: Record<string, string> = {
  "Edificio_X":               "Edificio_XX",
  "Edificio_X001":            "Edificio_X",
  "Fisico_Quimica":           "Laboratorio_Fisico_Quimica",
  "Laboratorio_Quimica":      "Laboratorio_Ing_Quimica",
  "Laboratorio_Electrica":    "Laboratorio_Ing_Electrica",
  "Laboratorio_Civil":        "Laboratorio_Ing_Civil",
  "Laboratorio_Industrial":   "Laboratorio_Ing_Industrial",
  "Aulas_ENIE":               "Aulas_N",
  "Geolocalizacion":          "Contenido_Geolocalizacion",
  "Sala_Titulacion":          "Sala_Titulacion_Aula_Dibujo_Lab_Microscopia",
  "Posgrado":                 "Edificio_Postgrado",
  "Depto_Quimica_Bioquimica": "Departamento_Ingenieria_Quimica_Bioquimica",
  "Depto_Electronica":        "Departamento_Ingenieria_Electronica",
  "Audiovisual_Posgrado":     "Audiovisual_Postgrado",
};

export function resolveGlbName(modelNodeName: string): string {
  return DB_TO_GLB_NAME[modelNodeName] ?? modelNodeName;
}
