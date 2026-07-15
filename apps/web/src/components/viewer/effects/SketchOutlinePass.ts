import {
  Color,
  DoubleSide,
  MeshNormalMaterial,
  NearestFilter,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { FullScreenQuad, Pass } from "three-stdlib";

// Detección de bordes por discontinuidad de NORMAL (no por profundidad ni
// por contraste de color) — el mismo tipo de línea que dibuja SketchUp en
// cada arista del modelo, sin depender de texturas/iluminación. Costo: un
// render extra de la escena con MeshNormalMaterial (sin texturas, barato) +
// un pase de shader de pantalla completa. No agrega draw calls por malla,
// así que no compite con los 933 draw calls ya optimizados de campus.glb.
//
// Deliberadamente NO se usa profundidad para detectar bordes: el <Canvas>
// del visor activa `logarithmicDepthBuffer: true` (fix de z-fighting ya
// existente), lo que cambia por completo cómo se codifican los valores en
// cualquier buffer/textura de profundidad. Decodificarlos con la fórmula
// estándar (perspectiveDepthToViewZ) da valores incorrectos y genera falsos
// bordes (parches negros en piso/techos, imagen general más oscura). La
// discontinuidad de normal por sí sola ya cubre las aristas reales de un
// modelo arquitectónico (piso vs. pared, pared vs. techo, silueta contra el
// fondo) sin depender en absoluto de cómo esté configurado el depth buffer.
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tNormal;
  uniform vec2 texSize;
  uniform vec3 edgeColor;
  uniform float edgeStrength;
  uniform float normalBias;
  varying vec2 vUv;

  void main() {
    vec2 texel = 1.0 / texSize;
    vec3 normalCenter = texture2D(tNormal, vUv).rgb;

    vec2 offsets[4];
    offsets[0] = vec2(texel.x, 0.0);
    offsets[1] = vec2(-texel.x, 0.0);
    offsets[2] = vec2(0.0, texel.y);
    offsets[3] = vec2(0.0, -texel.y);

    float normalDiff = 0.0;
    for (int i = 0; i < 4; i++) {
      normalDiff += distance(normalCenter, texture2D(tNormal, vUv + offsets[i]).rgb);
    }

    float edge = step(normalBias, normalDiff);

    vec4 base = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(mix(base.rgb, edgeColor, edge * edgeStrength), base.a);
  }
`;

export class SketchOutlinePass extends Pass {
  scene: Scene;
  camera: Camera;
  normalTarget: WebGLRenderTarget;
  normalMaterial: MeshNormalMaterial;
  fsQuad: FullScreenQuad<ShaderMaterial>;
  material: ShaderMaterial;
  private oldClearColor = new Color();
  private resolutionScale: number;

  constructor(scene: Scene, camera: Camera, resolution: Vector2, resolutionScale = 1) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.needsSwap = true;
    this.resolutionScale = resolutionScale;

    // DoubleSide: el GLB trae mallas con normales invertidas (ver comentario
    // equivalente en CampusModel.tsx). Sin esto, esas caras se recortan
    // (culling normal, FrontSide) solo en ESTE buffer de normales -aunque el
    // render de color sí las dibuje bien- creando huecos que el detector de
    // bordes interpreta como aristas falsas.
    this.normalMaterial = new MeshNormalMaterial({ side: DoubleSide });

    const w = Math.max(1, Math.round(resolution.x * resolutionScale));
    const h = Math.max(1, Math.round(resolution.y * resolutionScale));
    this.normalTarget = new WebGLRenderTarget(w, h, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });
    this.normalTarget.texture.name = "SketchOutlinePass.normal";

    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tNormal: { value: this.normalTarget.texture },
        texSize: { value: new Vector2(w, h) },
        // Tonos casi-negros (no #000 puro) para que la línea se sienta
        // dibujada a tinta, no una silueta recortada digitalmente.
        edgeColor: { value: new Color(0x2f2923) },
        edgeStrength: { value: 0.68 },
        // Ajustable a ojo si el resultado se ve con demasiado o muy poco
        // contorno una vez desplegado.
        normalBias: { value: 0.4 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  setSize(width: number, height: number) {
    const w = Math.max(1, Math.round(width * this.resolutionScale));
    const h = Math.max(1, Math.round(height * this.resolutionScale));
    this.normalTarget.setSize(w, h);
    this.material.uniforms.texSize.value.set(w, h);
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
    const oldOverrideMaterial = this.scene.overrideMaterial;
    const oldBackground = this.scene.background;
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.oldClearColor);

    this.scene.overrideMaterial = this.normalMaterial;
    this.scene.background = null;
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(this.normalTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    this.scene.overrideMaterial = oldOverrideMaterial;
    this.scene.background = oldBackground;
    renderer.setClearColor(this.oldClearColor, oldClearAlpha);

    this.material.uniforms.tDiffuse.value = readBuffer.texture;

    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.normalTarget.dispose();
    this.normalMaterial.dispose();
    this.material.dispose();
    this.fsQuad.dispose();
  }
}
