import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "mx.edu.itoaxaca.campusmap",
  appName: "Campus ITO",
  webDir: "dist",
  // La API de desarrollo es HTTP normal (sin certificado). Si la app corre
  // sobre https://localhost (default de Capacitor), Chrome bloquea toda
  // petición http:// como "mixed content". Sirviendo la app también por
  // http:// evita la mezcla — solo para desarrollo; en producción, con una
  // API real en HTTPS, hay que quitar esto y volver al default "https".
  server: {
    androidScheme: "http",
  },
};

export default config;
