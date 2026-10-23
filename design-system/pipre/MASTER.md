# Sistema visual de PIPRE

## Contexto y dirección

Laboratorio de pensamiento lógico para estudiantes de secundaria y docentes. Se mantiene la estructura React / application / infrastructure / shared / ui. Se priorizan lectura, orientación, controles predecibles y la continuidad de la simulación.

Referencia principal: UI/UX Pro Max. Consulta inicial `education learning dashboard`: la propuesta infantil no se adoptó. Consulta refinada `technical education analytics`: se adoptaron minimalismo funcional, contraste, jerarquía y cuadrícula. Frontend Design complementa la composición del laboratorio. No se incorporan nuevas dependencias ni fuentes remotas.

## Tokens

Fuente de implementación: `frontend/src/shared/constants/themes.ts` y `frontend/src/globals.css`.

| Uso | Laboratorio claro | Laboratorio oscuro | Ciruela |
|---|---|---|---|
| Fondo | #F3F6F7 | #10181F | #FAF5F8 |
| Superficie | #FFFFFF | #18232D | #FFFBFD |
| Primario | #076D60 | #5EE0B4 | #873F80 |
| Texto | #182E39 | #EAF0F5 | #302333 |
| Texto secundario | #526873 | #A9BBC9 | #70576A |
| Éxito | #237343 | #7AE0A4 | #237343 |
| Error | #B33048 | #FF9B9B | #B33048 |

Los tokens tradicionales `bg`, `surface`, `text` y los de Base UI apuntan a la misma paleta. Evitar transparencias sobre texto informativo. Los bordes decorativos no sustituyen la indicación de foco.

## Tipografía y composición

- Geist Variable local para texto y títulos. Monoespaciada del sistema para valores y coordenadas.
- Cuerpo 16 px; texto secundario 14 px; metadatos no inferiores a 12 px. Títulos de página entre 28 y 36 px.
- Escala de espacio 4 / 8 / 16 / 24 / 32 / 48 px. Contenido centrado hasta 1280 px; laboratorio hasta 1120 px.
- Tarjetas con borde visible, radios de 10–12 px y fondos semánticos. Iconos Lucide y marca existente.
- Una acción principal por grupo; acciones secundarias delineadas. Controles de al menos 44 px, salvo celdas que se adaptan al tablero.

## Navegación y estados

- Cabecera de 72 px, navegación completa desde 1280 px y menú lateral por debajo. Perfil y temas también disponibles en móvil.
- Las rutas de gestión se muestran a docentes y administradores, de acuerdo con los permisos del backend. Los estudiantes conservan su navegación de aprendizaje.
- Etiquetas visibles en formularios, autocompletado de acceso, errores anunciados y foco en el error.
- Modales con nombre, Escape, ciclo de Tab, restauración del foco y bloqueo del desplazamiento del fondo.
- Carga, ausencia de datos y error diferenciados. Los análisis de IA fallidos no presentan códigos HTTP al usuario.
- Movimiento reducido mediante `prefers-reduced-motion`; evitar escalados y elevaciones que cambien la posición del control.

## Simuladores

- Tablero de hasta 420 px y ancho limitado por el contenedor. La cuadrícula conserva su relación de aspecto.
- Selector de nivel, instrucciones, inventario, validación y métricas separados en orden de lectura.
- Arrastre conservado. Alternativa por clic, toque y botones nativos para teclado; mismos callbacks de colocación y rotación.
- Mantener `raycast`, `validatePlacement`, reglas de victoria y store de telemetría sin cambios.
- Pistas en el flujo del documento para evitar tapar el tablero y las acciones. Emisor y receptor identificados.

## Responsive y accesibilidad

Verificar a 320, 390, 768 y 1440 px. Una columna en móvil; dos en tablet donde corresponda; tres en analítica de escritorio. Tablas dentro de contenedores con desplazamiento horizontal. Formularios del editor en una columna en pantallas pequeñas.

Se usa como referencia [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/): contraste, reflujo, teclado, foco visible/no oculto, etiquetas, estados y alternativa al arrastre. Esto no constituye una certificación de conformidad.
