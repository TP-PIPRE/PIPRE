from __future__ import annotations

import textwrap
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyBboxPatch


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Guia_RIA01_Desempeno_y_Preprocessing.pdf"

PAGE_SIZE = (8.5, 11)
COLORS = {
    "ink": "#17202A",
    "muted": "#5D6D7E",
    "primary": "#176B87",
    "secondary": "#64CCC5",
    "accent": "#F39C12",
    "light": "#EAF4F4",
    "panel": "#F7F9FA",
    "danger": "#B03A2E",
    "white": "#FFFFFF",
}


def new_page(title: str, subtitle: str | None = None):
    fig = plt.figure(figsize=PAGE_SIZE, facecolor="white")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.add_patch(plt.Rectangle((0, 0.965), 1, 0.035, color=COLORS["primary"]))
    ax.text(
        0.07,
        0.925,
        title,
        fontsize=20,
        fontweight="bold",
        color=COLORS["ink"],
        va="top",
    )
    if subtitle:
        ax.text(0.07, 0.89, subtitle, fontsize=10.5, color=COLORS["muted"], va="top")
    return fig, ax


def footer(ax, page: int):
    ax.plot([0.07, 0.93], [0.055, 0.055], color="#D5DBDB", linewidth=0.8)
    ax.text(0.07, 0.032, "PIPRE | Data Science | RIA-01", fontsize=8, color=COLORS["muted"])
    ax.text(0.93, 0.032, str(page), fontsize=8, color=COLORS["muted"], ha="right")


def wrapped(text: str, width: int = 92) -> str:
    return "\n".join(textwrap.wrap(text, width=width, break_long_words=False))


def paragraph(ax, y: float, text: str, width: int = 92, size: float = 10.5):
    rendered = wrapped(text, width)
    lines = rendered.count("\n") + 1
    ax.text(0.08, y, rendered, fontsize=size, color=COLORS["ink"], va="top", linespacing=1.35)
    return y - lines * 0.024


def bullets(ax, y: float, items: list[str], width: int = 82, size: float = 10.2):
    for item in items:
        rendered = wrapped(item, width)
        lines = rendered.count("\n") + 1
        ax.text(0.095, y, "•", fontsize=size + 1, color=COLORS["primary"], va="top")
        ax.text(0.12, y, rendered, fontsize=size, color=COLORS["ink"], va="top", linespacing=1.35)
        y -= lines * 0.024 + 0.009
    return y


def section(ax, y: float, title: str):
    ax.text(0.08, y, title, fontsize=13, fontweight="bold", color=COLORS["primary"], va="top")
    return y - 0.038


def panel(ax, x: float, y: float, w: float, h: float, title: str, body: str, color=None):
    color = color or COLORS["light"]
    patch = FancyBboxPatch(
        (x, y - h),
        w,
        h,
        boxstyle="round,pad=0.012,rounding_size=0.008",
        facecolor=color,
        edgecolor="#CCD1D1",
        linewidth=0.8,
    )
    ax.add_patch(patch)
    ax.text(x + 0.018, y - 0.02, title, fontsize=11, fontweight="bold", color=COLORS["primary"], va="top")
    ax.text(
        x + 0.018,
        y - 0.058,
        body,
        fontsize=9.2,
        color=COLORS["ink"],
        va="top",
        linespacing=1.3,
    )


def code_box(ax, y: float, code: str, height: float = 0.14):
    patch = FancyBboxPatch(
        (0.08, y - height),
        0.84,
        height,
        boxstyle="round,pad=0.012,rounding_size=0.006",
        facecolor="#1E272E",
        edgecolor="#1E272E",
    )
    ax.add_patch(patch)
    ax.text(0.105, y - 0.022, code, family="DejaVu Sans Mono", fontsize=8.7, color="white", va="top", linespacing=1.35)
    return y - height - 0.025


def flow_box(ax, x: float, y: float, w: float, h: float, title: str, detail: str):
    patch = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.01,rounding_size=0.008",
        facecolor=COLORS["panel"],
        edgecolor=COLORS["primary"],
        linewidth=1.2,
    )
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h * 0.65, title, ha="center", va="center", fontsize=9.5, fontweight="bold", color=COLORS["primary"])
    ax.text(x + w / 2, y + h * 0.28, detail, ha="center", va="center", fontsize=7.5, color=COLORS["muted"])


def arrow(ax, start, end):
    ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle": "->", "color": COLORS["accent"], "lw": 1.8})


def build_pdf():
    with PdfPages(OUTPUT) as pdf:
        # Cover
        fig = plt.figure(figsize=PAGE_SIZE, facecolor="white")
        ax = fig.add_axes([0, 0, 1, 1])
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis("off")
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, color="#F7FBFC"))
        ax.add_patch(plt.Rectangle((0, 0.72), 1, 0.28, color=COLORS["primary"]))
        ax.add_patch(plt.Rectangle((0.07, 0.67), 0.16, 0.012, color=COLORS["accent"]))
        ax.text(0.07, 0.89, "PIPRE | DATA SCIENCE", fontsize=12, color=COLORS["secondary"], fontweight="bold")
        ax.text(0.07, 0.81, "RIA-01", fontsize=34, color="white", fontweight="bold")
        ax.text(0.07, 0.75, "Clasificador de desempeño", fontsize=22, color="white")
        ax.text(0.07, 0.60, "Guía entendible del modelo principal y su preprocessing", fontsize=16, color=COLORS["ink"], fontweight="bold")
        ax.text(0.07, 0.545, wrapped("Desde los datos recibidos por FastAPI hasta la clasificación final del estudiante, incluyendo entrenamiento, prevención de data leakage y evaluación.", 70), fontsize=11.5, color=COLORS["muted"], va="top", linespacing=1.4)
        panel(ax, 0.07, 0.40, 0.40, 0.17, "Modo predictivo", "Estima desempeño con intentos,\nerrores, nivel lógico e interacciones IA.\nNo recibe puntaje ni tasa de éxito.")
        panel(ax, 0.53, 0.40, 0.40, 0.17, "Modo por regla", "Clasifica el resultado ya conocido usando\npuntaje y tasa de éxito. Es una regla\ndeterminista, no Machine Learning.", "#FFF6E5")
        ax.text(0.07, 0.10, "Versión explicada: ria01-v10-error-events", fontsize=9.5, color=COLORS["muted"])
        ax.text(0.07, 0.075, "Generado desde la implementación actual de data-science", fontsize=9.5, color=COLORS["muted"])
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 2
        fig, ax = new_page("1. ¿Qué hace RIA-01?", "Objetivo, entradas y dos formas de clasificar")
        y = 0.84
        y = paragraph(ax, y, "RIA-01 determina si el desempeño de un estudiante es bajo o adecuado. Su finalidad principal es producir una estimación temprana cuando todavía no se desea usar el puntaje final ni la tasa de éxito.")
        y -= 0.012
        y = section(ax, y, "Datos que recibe el modo predictivo")
        panel(ax, 0.08, y, 0.19, 0.14, "attempts", "Cantidad de intentos\nrealizados.")
        panel(ax, 0.295, y, 0.19, 0.14, "errors", "Eventos de error. Puede\nhaber varios por intento.")
        panel(ax, 0.51, y, 0.19, 0.14, "logical_level", "Nivel lógico reportado:\nbajo, medio o alto.")
        panel(ax, 0.725, y, 0.19, 0.14, "ai_interactions", "Cantidad de\ninteracciones con IA.")
        y -= 0.19
        y = section(ax, y, "Dos modos que no deben confundirse")
        panel(ax, 0.08, y, 0.40, 0.22, "A. predict(): Machine Learning", "• Se usa antes del resultado final.\n• Solo utiliza señales disponibles en producción.\n• Devuelve bajo o adecuado.\n• Sus métricas miden capacidad de generalización.")
        panel(ax, 0.52, y, 0.40, 0.22, "B. predict_rule(): regla exacta", "• Requiere puntaje y tasa de éxito.\n• Aplica una fórmula conocida.\n• No aprende patrones.\n• Sirve cuando el resultado final ya existe.", "#FFF6E5")
        y -= 0.27
        y = section(ax, y, "Contrato FastAPI")
        y = code_box(ax, y, '{\n  "attempts": 4,\n  "errors": 7,\n  "logical_level": "medio",\n  "ai_interactions": 3\n}', 0.18)
        y = paragraph(ax, y, "El endpoint traduce estos nombres en inglés a los nombres internos del dataset: intentos, errores, nivel_logico e interacciones_ia.", 90, 9.8)
        footer(ax, 2)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 3 - flow
        fig, ax = new_page("2. Flujo completo de entrenamiento", "El test permanece aislado hasta el final")
        positions = [
            (0.08, 0.78, "1. Dataset", "650 registros"),
            (0.32, 0.78, "2. Target", "regla o etiqueta externa"),
            (0.56, 0.78, "3. Calidad", "nulos, escalas y semántica"),
            (0.76, 0.78, "4. Split", "train 80% / test 20%"),
            (0.76, 0.55, "5. Pipeline CV", "preprocessing por fold"),
            (0.52, 0.55, "6. Búsqueda", "modelo + features + parámetros"),
            (0.28, 0.55, "7. Sanidad", "20 etiquetas aleatorias"),
            (0.08, 0.55, "8. Selección", "mejor candidato de CV"),
            (0.08, 0.32, "9. Test final", "una única evaluación"),
            (0.35, 0.32, "10. Reportes", "métricas e importancias"),
            (0.65, 0.32, "11. Persistencia", "ria01_model.pkl"),
        ]
        widths = [0.17, 0.17, 0.17, 0.16, 0.16, 0.17, 0.17, 0.17, 0.19, 0.20, 0.22]
        for pos, width in zip(positions, widths):
            x, y0, title, detail = pos
            flow_box(ax, x, y0, width, 0.11, title, detail)
        for start, end in [
            ((0.25, 0.835), (0.32, 0.835)),
            ((0.49, 0.835), (0.56, 0.835)),
            ((0.73, 0.835), (0.76, 0.835)),
            ((0.84, 0.78), (0.84, 0.66)),
            ((0.76, 0.605), (0.69, 0.605)),
            ((0.52, 0.605), (0.45, 0.605)),
            ((0.28, 0.605), (0.25, 0.605)),
            ((0.165, 0.55), (0.165, 0.43)),
            ((0.27, 0.375), (0.35, 0.375)),
            ((0.55, 0.375), (0.65, 0.375)),
        ]:
            arrow(ax, start, end)
        panel(ax, 0.08, 0.20, 0.84, 0.10, "Idea clave", "El test no se usa para seleccionar variables, algoritmo ni hiperparámetros. Solo se abre cuando el Pipeline ya quedó definido.", "#E8F8F5")
        footer(ax, 3)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 4 target
        fig, ax = new_page("3. Cómo se construye la etiqueta", "La etiqueta define qué intenta aprender el modelo")
        y = 0.84
        y = section(ax, y, "Opción 1: target_source = rule")
        y = paragraph(ax, y, "Durante el entrenamiento se combina el puntaje con la tasa de éxito. Estas columnas se usan únicamente para crear la respuesta correcta del entrenamiento; después se excluyen de las features predictivas.")
        y = code_box(ax, y - 0.005, "score_compuesto = puntaje * 0.5 + tasa_exito * 100 * 0.5\n\nsi score_compuesto < 67:  rendimiento = 'bajo'\nsi score_compuesto >= 67: rendimiento = 'adecuado'", 0.16)
        y = section(ax, y, "Normalización de tasa_exito")
        y = bullets(ax, y, [
            "Cada fila se normaliza individualmente: 0.80 permanece 0.80 y 75 se convierte en 0.75.",
            "Los valores negativos, mayores que 100 o nulos no se convierten falsamente en cero.",
            "Se informa si el dataset mezcla escalas 0–1 y 0–100.",
        ])
        y = section(ax, y, "Opción 2: target_source = existing")
        y = paragraph(ax, y, "Si existe una etiqueta externa llamada rendimiento, RIA-01 puede entrenar directamente con ella. En este modo no son obligatorios puntaje ni tasa_exito y el baseline por regla se marca como no disponible si faltan.")
        y -= 0.012
        panel(ax, 0.08, y, 0.84, 0.13, "Separación metodológica", "La regla responde: “¿cuál es el desempeño conocido?”. El ML responde: “¿puedo estimarlo temprano sin ver las variables que lo definen?”.")
        footer(ax, 4)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 5 preprocessing
        fig, ax = new_page("4. Qué aporta ria01_preprocessing.py", "Convierte datos crudos en variables confiables dentro de cada fold")
        y = 0.84
        y = section(ax, y, "RIA01FeatureEngineer.fit(): aprende solo de train")
        y = bullets(ax, y, [
            "Convierte errores, intentos e interacciones_ia a valores numéricos.",
            "Los negativos se tratan como faltantes, no como resultados reales.",
            "Calcula la mediana de cada columna usando únicamente el train del fold.",
            "Normaliza nivel_logico y registra valores desconocidos.",
        ])
        y = section(ax, y, "RIA01FeatureEngineer.transform(): aplica y deriva")
        left = (
            "BASE\n"
            "• intentos\n• errores\n• nivel_logico\n• interacciones_ia\n\n"
            "FALTANTES\n"
            "• errores_faltante\n• intentos_faltante\n"
            "• interacciones_ia_faltante\n• nivel_logico_faltante"
        )
        right = (
            "DERIVADAS\n"
            "• ratio_error = errores / intentos\n"
            "• dependencia_ia = IA / intentos\n"
            "• ia_por_error = IA / errores\n"
            "• tuvo_errores\n• uso_ia\n"
            "• nivel_x_error\n\n"
            "Todas quedan numéricas y sin infinitos."
        )
        panel(ax, 0.08, y, 0.40, 0.31, "Columnas directas", left)
        panel(ax, 0.52, y, 0.40, 0.31, "Variables derivadas", right, "#FFF9EB")
        y -= 0.36
        panel(ax, 0.08, y, 0.84, 0.14, "Semántica confirmada de errores", "errores cuenta eventos: un intento puede contener varios. Por ello ratio_error significa errores por intento, puede ser mayor que 1 y no es una probabilidad. Se eliminó intentos_sin_error porque intentos - eventos de error no tiene sentido.", "#E8F8F5")
        footer(ax, 5)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 6 fold-safe
        fig, ax = new_page("5. Por qué el preprocessing vive dentro del Pipeline", "La diferencia entre una evaluación válida y una métrica inflada")
        y = 0.84
        y = paragraph(ax, y, "En validación cruzada, cada fold tiene una parte de entrenamiento y otra de validación. Si la mediana se calcula antes de separar el fold, la validación aporta información al entrenamiento. Eso es data leakage.")
        y -= 0.02
        panel(ax, 0.08, y, 0.38, 0.22, "Incorrecto", "1. Calcular medianas con todo train.\n2. Crear variables derivadas.\n3. Ejecutar CV.\n\nLa validación ya influyó en las medianas.", "#FDEDEC")
        panel(ax, 0.54, y, 0.38, 0.22, "Implementación actual", "1. Separar el fold.\n2. fit() solo con train del fold.\n3. transform() sobre validación.\n4. Evaluar sin información anticipada.", "#E8F8F5")
        y -= 0.28
        y = section(ax, y, "FeatureSubsetSelector")
        y = paragraph(ax, y, "Después de crear todas las variables, este segundo transformador selecciona un conjunto concreto. La selección forma parte de RandomizedSearchCV; no se eligen features mirando el test.")
        y -= 0.015
        y = section(ax, y, "Ejemplo sencillo")
        y = code_box(ax, y, "Train del fold: errores = [1, 3]  -> mediana aprendida = 2\nValidación:     errores = [null, 999]\nTransformado:   errores = [2, 999]\n\nEl 999 de validación nunca participa en la mediana.", 0.17)
        y = paragraph(ax, y, "Al finalizar la selección, el Pipeline ganador se vuelve a ajustar con todo el train final. Esa mediana se usa después para transformar el test y las solicitudes de producción.", 90, 9.8)
        footer(ax, 6)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 7 selection leakage
        fig, ax = new_page("6. Selección del modelo y controles de fuga", "Cómo se decide el mejor Pipeline sin manipular el test")
        y = 0.84
        y = section(ax, y, "Búsqueda conjunta")
        y = bullets(ax, y, [
            "Algoritmos comparados: Random Forest, Extra Trees e HistGradientBoosting.",
            "La búsqueda combina algoritmo, conjunto de features e hiperparámetros.",
            "El criterio considera F1 macro, balanced accuracy, desviación entre folds y brecha train-validación.",
            "El modelo actual seleccionado es Extra Trees con el conjunto base_only.",
        ])
        y = section(ax, y, "Separación por estudiante")
        y = bullets(ax, y, [
            "Se usa id_estudiante como grupo.",
            "GroupShuffleSplit prueba hasta 500 particiones para aproximar el 20% de test.",
            "Train, test y cada fold deben contener todas las clases.",
            "Se verifica explícitamente que ningún estudiante aparezca a ambos lados.",
        ])
        y = section(ax, y, "Diagnósticos de leakage")
        y = bullets(ax, y, [
            "tasa_exito no entra como feature. Además, 1 - errores/intentos no es semánticamente válido porque errores cuenta eventos múltiples.",
            "nivel_logico puede mantenerse, excluirse o detener el entrenamiento según su origen y leakage_policy.",
            "Se ejecutan 20 permutaciones de etiquetas: si el flujo aprende etiquetas aleatorias demasiado bien, se reporta posible fuga.",
            "La importancia por permutación se promedia en los folds; nunca se usa el test para eliminar variables.",
        ], width=80, size=9.8)
        footer(ax, 7)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 8 prediction
        fig, ax = new_page("7. Flujo de una predicción", "Del JSON del backend a la respuesta de FastAPI")
        y0 = 0.73
        boxes = [
            (0.06, "JSON", "nombres en inglés"),
            (0.25, "Adaptador", "mapea al dataset"),
            (0.44, "Preprocessing", "imputa y deriva"),
            (0.65, "Extra Trees", "clasifica 0 o 1"),
            (0.82, "Servicio", "respuesta estándar"),
        ]
        widths = [0.13, 0.14, 0.15, 0.13, 0.13]
        for (x, title, detail), w in zip(boxes, widths):
            flow_box(ax, x, y0, w, 0.13, title, detail)
        for x1, x2 in [(0.19, 0.25), (0.39, 0.44), (0.59, 0.65), (0.78, 0.82)]:
            arrow(ax, (x1, y0 + 0.065), (x2, y0 + 0.065))
        y = 0.63
        y = section(ax, y, "Ejemplo con varios errores por intento")
        y = code_box(ax, y, "Entrada: attempts=3, errors=8, logical_level='medio', ai_interactions=2\n\nratio_error = 8 / 3 = 2.667  # densidad válida, no porcentaje\ndependencia_ia = 2 / 3 = 0.667\nia_por_error = 2 / 8 = 0.250", 0.17)
        y = section(ax, y, "Respuesta del API")
        y = code_box(ax, y, '{\n  "result": "adequate",\n  "accuracy": 0.8077,\n  "precision": 0.7978\n}', 0.15)
        y = paragraph(ax, y, "Internamente el modelo devuelve bajo o adecuado. RIA01Service traduce esas etiquetas a low o adequate y redondea las métricas a cuatro decimales.", 90, 9.8)
        y -= 0.012
        panel(ax, 0.08, y, 0.84, 0.10, "Probabilidades", "predict_proba() devuelve siempre las dos clases en orden funcional: bajo y adecuado, incluso si una probabilidad es cero.")
        footer(ax, 8)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 9 metrics and files
        fig, ax = new_page("8. Cómo interpretar el resultado actual", "Métricas del modelo persistido ria01-v10-error-events")
        panel(ax, 0.08, 0.82, 0.19, 0.14, "Accuracy", "0.8077\n80.77% de aciertos")
        panel(ax, 0.295, 0.82, 0.19, 0.14, "Precision API", "0.7978\nprecision ponderada")
        panel(ax, 0.51, 0.82, 0.19, 0.14, "Balanced acc.", "0.7000\nequilibrio por clase")
        panel(ax, 0.725, 0.82, 0.19, 0.14, "F1 macro", "0.7118\npromedio entre clases")
        y = 0.62
        y = section(ax, y, "Matriz de confusión")
        y = code_box(ax, y, "Orden de clases: [bajo, adecuado]\n\n[[15, 15],\n [10, 90]]", 0.14)
        y = bullets(ax, y, [
            "De 30 casos bajos, detecta correctamente 15: recall de bajo = 50%.",
            "De 100 casos adecuados, detecta correctamente 90: recall de adecuado = 90%.",
            "El accuracy del DummyClassifier es 0.7692, pero su F1 macro es solo 0.4348; acertar la clase mayoritaria no basta.",
            "La prueba con etiquetas aleatorias obtiene balanced accuracy cercana a 0.50, como se espera al azar.",
        ])
        y = section(ax, y, "Archivos responsables")
        y = code_box(ax, y, "app/adapters/ml_models/ria01_desempeño.py      lógica principal\napp/adapters/ml_support/ria01_preprocessing.py  transformación fold-safe\napp/application/services/ria01_service.py       contrato de respuesta\napp/adapters/api/schemas.py                     body validado\napp/adapters/api/main.py                        endpoint /ria01/predict", 0.16)
        footer(ax, 9)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Page 10 summary
        fig, ax = new_page("9. Resumen para exposición", "RIA-01 en menos de dos minutos")
        y = 0.84
        y = bullets(ax, y, [
            "RIA-01 estima si el desempeño es bajo o adecuado antes de usar el resultado final.",
            "FastAPI solicita intentos, eventos de error, nivel lógico e interacciones con IA.",
            "El preprocessing limpia, imputa y crea variables dentro de cada fold para evitar data leakage.",
            "Errores puede superar intentos porque representa eventos; la razón significa errores por intento.",
            "La selección conjunta compara modelos, features e hiperparámetros mediante validación cruzada.",
            "El test queda reservado hasta el final y no decide qué variables conservar.",
            "Extra Trees fue seleccionado y el modelo persistido alcanza accuracy 0.8077 y precision 0.7978.",
            "El modo predict_rule es distinto: usa puntaje y tasa de éxito para aplicar una regla exacta, no ML.",
        ], width=80, size=11)
        y -= 0.01
        panel(ax, 0.08, y, 0.84, 0.17, "Mensaje central", "RIA-01 no intenta adivinar una fórmula usando sus mismos componentes. Mantiene una regla para el resultado conocido y un modelo separado para estimación temprana con señales disponibles en producción.", "#E8F8F5")
        ax.text(0.5, 0.16, "Fin de la guía", fontsize=16, fontweight="bold", color=COLORS["primary"], ha="center")
        ax.text(0.5, 0.12, "Documento generado desde el código actual de data-science", fontsize=9.5, color=COLORS["muted"], ha="center")
        footer(ax, 10)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
