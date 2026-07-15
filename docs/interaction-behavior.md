# Modelo de interacción del mapa

Este proyecto debe funcionar bien como web, app móvil y en pantallas táctiles
grandes. La regla base es detectar capacidades de entrada, no solo ancho de
pantalla: un iPad, una laptop táctil y una PC de escritorio necesitan
comportamientos distintos aunque compartan resolución.

## Perfiles

| Perfil | Señal principal | Navegación esperada |
| --- | --- | --- |
| Teléfono | Touch, ancho menor a 768 px | Controles grandes, una acción principal por vez, panel inferior. |
| Tablet táctil | Touch, ancho desde 768 px | Gestos suaves, paneles más amplios, botones táctiles de 44 px o más. |
| Híbrido | Touch + mouse/fine pointer | Permite gestos y mouse; evita esconder funciones detrás de hover. |
| Escritorio/laptop | Mouse/fine pointer + hover | Mouse preciso, atajos de teclado, tooltips y panel lateral. |

## Mapa 3D

| Acción | Mouse/laptop | Touch/tablet/app | Teclado |
| --- | --- | --- | --- |
| Rotar mapa | Arrastrar con botón izquierdo | Arrastrar con un dedo | No aplica |
| Mover/pan | Botón derecho y arrastrar | Dos dedos | No aplica |
| Acercar/alejar | Rueda o botones + / - | Pellizcar con dos dedos | `+` / `-` |
| Vista inicial | Botón inicio | Botón inicio | `0` o `Home` |
| Cambiar vista aérea/inmersiva | Botón de vista | Botón de vista | `V` |
| Centrar ubicación | Botón ubicación | Botón ubicación | `L` si hay ubicación |
| Cancelar selección/ruta | Botón contextual o nueva selección | Cerrar panel / nueva selección | `Esc` |

Los atajos no se activan si el usuario está escribiendo en un input, textarea,
select o contenido editable.

## UI por dispositivo

- Teléfono: priorizar panel inferior, barra superior compacta y acciones
  visibles. Evitar depender de hover.
- Tablet táctil: mantener área del mapa amplia; paneles flotantes deben cerrar
  con botones claros y permitir scroll interno.
- Laptop táctil/híbrida: los controles deben responder igual con mouse y touch.
  Los hover son solo una mejora visual, nunca la única forma de descubrir una
  acción.
- Escritorio: aprovechar teclado, tooltips, botón derecho para pan y rueda para
  zoom.

## Siguientes mejoras recomendadas

- Agregar una ayuda breve de controles dentro del toolbar, adaptada al perfil.
- Guardar preferencia de sensibilidad de navegación por usuario/dispositivo.
- Añadir pruebas visuales para teléfono, tablet y escritorio.
- Revisar el editor administrativo de navegación con el mismo modelo de entrada.
