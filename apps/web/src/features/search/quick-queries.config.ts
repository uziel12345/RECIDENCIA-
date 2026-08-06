import type { QuickQuery } from "@ito-map/shared";

// Respaldo para instalaciones que aún no aplican el seed. La API sigue siendo
// la fuente principal; esta configuración evita dejar la ayuda inicial vacía.
export const QUICK_QUERY_FALLBACK: QuickQuery[] = [
  { id: "quick-enrollment", label: "¿Dónde puedo inscribirme?", query: "quiero inscribirme", category: "service", icon: "info", priority: 120 },
  { id: "quick-certificate", label: "¿Dónde solicito una constancia?", query: "constancia de estudios", category: "service", icon: "book-open", priority: 115 },
  { id: "quick-director", label: "¿Dónde está el director?", query: "donde encuentro al director", category: "position", icon: "user", priority: 110 },
  { id: "quick-school-services", label: "¿Dónde está Servicios Escolares?", query: "servicios escolares", category: "department", icon: "info", priority: 105 },
  { id: "quick-systems", label: "¿Dónde está el Departamento de Sistemas?", query: "departamento de sistemas", category: "department", icon: "building", priority: 100 },
  { id: "quick-social-service", label: "¿Dónde realizo el servicio social?", query: "servicio social", category: "service", icon: "users", priority: 95 },
  { id: "quick-complementary", label: "¿Dónde tramito actividades complementarias?", query: "actividades complementarias", category: "service", icon: "check", priority: 90 },
  { id: "quick-english", label: "¿Dónde solicito una constancia de inglés?", query: "constancia de terminacion de ingles", category: "service", icon: "book-open", priority: 85 },
  { id: "quick-classrooms", label: "¿Dónde están las aulas?", query: "aulas", category: "classroom", icon: "graduation", priority: 80 },
  { id: "quick-info", label: "¿Dónde puedo pedir información?", query: "centro de informacion", category: "building", icon: "info", priority: 75 },
  { id: "quick-library", label: "¿Dónde está la biblioteca?", query: "biblioteca", category: "building", icon: "book-open", priority: 70 },
  { id: "quick-computing", label: "¿Dónde está el Centro de Cómputo?", query: "centro de computo", category: "building", icon: "building", priority: 65 },
];
