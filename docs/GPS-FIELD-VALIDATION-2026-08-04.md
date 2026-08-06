# Validación GPS de campo — 4 de agosto de 2026

Lecturas tomadas físicamente en accesos del campus con el panel GPS v2. Todas
las posiciones tuvieron precisión reportada menor a 4 m.

| Punto | GPS | Precisión | X/Z calculado | Resultado |
| --- | --- | ---: | --- | --- |
| Centro de Cómputo | `17.0789672, -96.7443598` | 3.07 m | `58.1813, -71.4977` | Dentro del nodo de CC |
| Dirección | `17.0774984, -96.7450752` | 3.44 m | `-44.1899, -3.5751` | Dentro del nodo de Dirección |
| Biblioteca | `17.0774978, -96.7443038` | 3.73 m | `3.4767, 25.6537` | A 1.4 m de la fachada oeste |
| Cafetería | `17.0772849, -96.7441639` | 3.66 m | `3.6980, 44.7167` | A 0.6 m de la fachada sur |
| Edificio I | `17.0760812, -96.7448600` | 3.85 m | `-86.9860, 96.2245` | X correcto; Z desplazado 20.4 m |
| Edificio Q | `17.0772419, -96.7436364` | 3.00 m | `34.6075, 67.4584` | A 0.92 m de la fachada sur |

## Corrección localizada de Edificio I

La captura de campo permitió identificar que el usuario estaba frente a la
puerta principal. En el GLB, el umbral correspondiente se encuentra en:

```text
x = -86.9120
z = 110.1097
```

El X calculado difería solo 0.074 unidades (aproximadamente 11 cm), mientras
que Z quedaba 13.885 unidades hacia afuera (aproximadamente 20.4 m). Una
corrección global o affine movía puntos que ya coincidían correctamente,
especialmente Centro de Cómputo y Dirección.

Por eso `CAMPUS_LOCAL_CORRECTIONS` aplica el desplazamiento de Edificio I con
efecto completo dentro de 8 m de la lectura medida y una caída suave hasta
cero a 35 m. El resto del campus conserva la transformación global validada.
