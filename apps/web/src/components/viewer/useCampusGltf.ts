import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { KTX2Loader } from "three-stdlib";
import { Capacitor } from "@capacitor/core";

// La app nativa (Capacitor) empaqueta el modelo con texturas KTX2/UASTC en
// vez de WebP: se decodifican directo en la GPU, sin pasar por el CPU del
// teléfono — el mismo archivo original pesa más en disco (~6.4MB vs 3.65MB)
// pero al no viajar por red dentro de la app, lo que importa es el tiempo de
// carga/proceso, no el tamaño de descarga. La web sigue usando el .glb con
// WebP: ahí sí importa el peso de descarga y ya está bien calibrado.
const isNative = Capacitor.isNativePlatform();

export const MODEL_PATH = isNative
  ? "/models/campus-app.glb"
  : "/models/campus.glb";

// Precarga temprana solo en web: el .glb ahí usa WebP, así que un
// GLTFLoader plano (sin KTX2Loader) lo puede parsear sin problema. La
// variante nativa (KTX2) SÍ necesita el KTX2Loader adjunto antes de
// parsear, y ese loader necesita un WebGLRenderer real (detectSupport) que
// todavía no existe a esta altura (antes de montar el <Canvas>) — ahí el
// primer useCampusGltf() dentro de un componente se encarga de cargarlo.
if (!isNative) {
  useGLTF.preload(MODEL_PATH);
}

let ktx2Loader: KTX2Loader | null = null;

function getKtx2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader().setTranscoderPath("/basis/");
  }
  return ktx2Loader;
}

/**
 * Carga el modelo del campus con soporte KTX2 ya configurado. El GLB de la
 * web (WebP) simplemente no usa la extensión KHR_texture_basisu, así que
 * adjuntar el KTX2Loader es inofensivo ahí — un solo hook sirve para ambas
 * variantes sin condicionales en cada punto de uso.
 */
export function useCampusGltf() {
  const { gl } = useThree();
  return useGLTF(MODEL_PATH, false, false, (loader) => {
    loader.setKTX2Loader(getKtx2Loader().detectSupport(gl));
  });
}
