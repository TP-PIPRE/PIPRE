export const TETRILOGIC_TIPS = [
  "Compara las casillas ocupadas con el objetivo de cada fila y columna.",
  "Si una fila o columna tiene objetivo cero, déjala vacía.",
  "Antes de colocar una pieza, fíjate en cuántas casillas añadirá a cada fila y columna que toque.",
  "Si una línea tiene casillas de más, prueba mover o girar una pieza que la cruce.",
  "Cuando a una fila y a una columna les falten casillas, revisa si una pieza puede cubrir su cruce.",
  "Empieza por las líneas con menos lugares donde colocar una pieza. Eso reduce las opciones que tienes que probar.",
] as const;

export const NEON_FLOW_TIPS = [
  "Sigue la dirección del haz desde el emisor y comprueba hacia dónde lo desvía cada espejo.",
  "Un filtro solo deja pasar un haz de su mismo color. Compara ambos colores antes de colocarlo.",
  "Si un obstáculo bloquea el camino, busca una ruta que cambie de dirección antes de llegar a él.",
  "Mira el receptor y piensa desde qué casillas puede llegar el haz. Luego traza el camino hacia atrás.",
  "Si el haz sale del tablero, revisa el último espejo por el que pasó y prueba otro giro.",
  "Prueba un cambio a la vez y pulsa Comprobar para ver qué efecto tiene en el recorrido del haz.",
] as const;
