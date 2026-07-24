import tkinter as tk
from tkinter import ttk
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt


class AppResultados:

    def __init__(self, root, resultados, evaluar_otro=None):
        self.root = root
        self.root.title("Resultados del Sistema IA")
        self.root.geometry("1200x800")

        self.resultados = resultados
        self.evaluar_otro = evaluar_otro  # 🔥 importante mover aquí

        self.crear_interfaz()

    @staticmethod
    def formatear_valor_tabla(valor):
        if isinstance(valor, dict):
            partes = []
            for clave, item in valor.items():
                partes.append(f"{clave}: {AppResultados.formatear_valor_tabla(item)}")
            texto = "; ".join(partes)
        elif isinstance(valor, (list, tuple, set)):
            texto = ", ".join(str(item) for item in valor)
        else:
            texto = str(valor)

        texto = texto.replace("\n", " ").strip()
        return texto if len(texto) <= 90 else f"{texto[:87]}..."

    @staticmethod
    def formatear_detalle(valor, nivel=0):
        sangria = "  " * nivel

        if isinstance(valor, dict):
            lineas = []
            for clave, item in valor.items():
                if isinstance(item, (dict, list, tuple, set)):
                    lineas.append(f"{sangria}{clave}:")
                    lineas.append(AppResultados.formatear_detalle(item, nivel + 1))
                else:
                    lineas.append(f"{sangria}{clave}: {item}")
            return "\n".join(lineas)

        if isinstance(valor, (list, tuple, set)):
            if not valor:
                return f"{sangria}- Sin datos"

            lineas = []
            for item in valor:
                if isinstance(item, (dict, list, tuple, set)):
                    lineas.append(f"{sangria}-")
                    lineas.append(AppResultados.formatear_detalle(item, nivel + 1))
                else:
                    lineas.append(f"{sangria}- {item}")
            return "\n".join(lineas)

        return f"{sangria}{valor}"

    @staticmethod
    def crear_texto_lectura(frame, texto):
        contenedor = tk.Frame(frame)
        contenedor.pack(fill="both", expand=True, padx=20, pady=10)

        scrollbar = ttk.Scrollbar(contenedor, orient="vertical")
        texto_widget = tk.Text(
            contenedor,
            height=12,
            width=92,
            wrap="word",
            font=("Consolas", 10),
            yscrollcommand=scrollbar.set,
            relief="solid",
            borderwidth=1
        )

        scrollbar.configure(command=texto_widget.yview)
        texto_widget.insert("1.0", texto)
        texto_widget.configure(state="disabled")

        texto_widget.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

    def crear_interfaz(self):

        titulo = tk.Label(
            self.root,
            text="Dashboard de Resultados IA",
            font=("Arial", 18, "bold")
        )
        titulo.pack(pady=10)

        notebook = ttk.Notebook(self.root)
        notebook.pack(expand=True, fill="both")

        for ria, data in self.resultados.items():
            frame = ttk.Frame(notebook)
            notebook.add(frame, text=ria)

            self.crear_panel(frame, ria, data)

    def crear_panel(self, frame, ria, data):

        # =========================
        # SCROLL
        # =========================
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)

        container = tk.Frame(canvas)

        container.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=container, anchor="n")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # =========================
        #  FRAME CENTRAL (CENTRADO REAL)
        # =========================
        wrapper = tk.Frame(container)
        wrapper.pack(expand=True)

        center_frame = tk.Frame(wrapper)
        center_frame.pack()

        if "RIA7" in ria and data.get("tabla_docente"):
            self.crear_tabla_docente(
                center_frame,
                data["tabla_docente"],
                data.get("resumen_docente", {}),
            )

        # =========================
        #  DATOS
        # =========================
        input_data = data.get("input_data", None)

        if input_data:
            box = tk.LabelFrame(center_frame, text="Datos evaluados", font=("Arial", 11, "bold"))
            box.pack(pady=10)

            tabla = ttk.Treeview(
                box,
                columns=("Variable", "Valor"),
                show="headings",
                height=min(max(len(input_data), 4), 10)
            )

            tabla.heading("Variable", text="Variable")
            tabla.heading("Valor", text="Valor")

            tabla.column("Variable", width=240, anchor="w")
            tabla.column("Valor", width=520, anchor="w")

            for k, v in input_data.items():
                tabla.insert("", "end", values=(k, self.formatear_valor_tabla(v)))

            tabla.pack(padx=20, pady=10)

        # =========================
        #  RESULTADO
        # =========================
        box_result = tk.LabelFrame(center_frame, text="Resultado", font=("Arial", 11, "bold"))
        box_result.pack(pady=10)

        tk.Label(
            box_result,
            text=data.get("resultado", "N/A"),
            font=("Arial", 14, "bold"),
            fg="#2c3e50"
        ).pack(padx=20, pady=10)

        detalle = data.get("detalle")
        if detalle:
            box_detalle = tk.LabelFrame(center_frame, text="Detalle", font=("Arial", 11, "bold"))
            box_detalle.pack(pady=10, fill="x")

            detalle_texto = self.formatear_detalle(detalle)
            self.crear_texto_lectura(box_detalle, detalle_texto)

        # =========================
        #  RIA7
        # =========================
        if "RIA7" in ria:
            box_anom = tk.LabelFrame(center_frame, text="Análisis de riesgo y anomalías", font=("Arial", 11, "bold"))
            box_anom.pack(pady=10)

            tk.Label(
                box_anom,
                text=data.get("anomalias", "N/A"),
                font=("Arial", 11)
            ).pack(padx=20, pady=10)

            pesos_riesgo = data.get("pesos_riesgo", None)
            if pesos_riesgo:
                self.crear_grafico_importancia(
                    center_frame,
                    pesos_riesgo,
                    titulo="Pesos heurísticos configurados del riesgo",
                )

        elif data.get("metricas_operativas"):
            box_metricas = tk.LabelFrame(
                center_frame,
                text="Metricas operativas",
                font=("Arial", 11, "bold"),
            )
            box_metricas.pack(pady=10, fill="x")
            metricas_texto = self.formatear_detalle(data["metricas_operativas"])
            self.crear_texto_lectura(box_metricas, metricas_texto)

        elif data.get("calidad_clustering"):
            box_calidad = tk.LabelFrame(
                center_frame,
                text="Qué tan claros son los grupos",
                font=("Arial", 11, "bold"),
            )
            box_calidad.pack(pady=10, fill="x")
            calidad_texto = self.formatear_detalle(
                data["calidad_clustering"]
            )
            self.crear_texto_lectura(box_calidad, calidad_texto)

        else:
            # =========================
            #  MÉTRICAS
            # =========================
            box_metricas = tk.LabelFrame(center_frame, text="Métricas", font=("Arial", 11, "bold"))
            box_metricas.pack(pady=10)

            accuracy = data.get("accuracy", 0)
            precision = data.get("precision", 0)

            frame_metrics = tk.Frame(box_metricas)
            frame_metrics.pack()

            tk.Label(
                frame_metrics,
                text=f"Accuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)",
                width=28
            ).grid(row=0, column=0, padx=20, pady=5)

            tk.Label(
                frame_metrics,
                text=f"Precision: {precision:.4f} ({precision * 100:.2f}%)",
                width=28
            ).grid(row=0, column=1, padx=20, pady=5)

            # =========================
            # GRÁFICO
            # =========================
            importancias = data.get("importancias", None)
            if importancias:
                self.crear_grafico_importancia(center_frame, importancias)

        # =========================
        # BOTÓN (AHORA SÍ FUNCIONA)
        # =========================
        if self.evaluar_otro:
            btn_frame = tk.Frame(center_frame)
            btn_frame.pack(pady=20)

            tk.Button(
                btn_frame,
                text="🔄 Evaluar otra fila",
                font=("Arial", 11, "bold"),
                bg="#3498db",
                fg="white",
                padx=15,
                pady=6,
                command=self.ejecutar_evaluacion
            ).pack()

    def crear_tabla_docente(self, frame, estudiantes, resumen):
        box = tk.LabelFrame(
            frame,
            text="Alertas tempranas para el docente",
            font=("Arial", 11, "bold"),
        )
        box.pack(padx=16, pady=10, fill="both", expand=True)

        resumen_texto = (
            f"Total: {resumen.get('total', len(estudiantes))}   |   "
            f"Críticos: {resumen.get('critico', 0)}   |   "
            f"Atención: {resumen.get('atencion', 0)}   |   "
            f"Normales: {resumen.get('normal', 0)}   |   "
            f"Anomalías: {resumen.get('anomalias', 0)}"
        )
        tk.Label(
            box,
            text=resumen_texto,
            font=("Arial", 10, "bold"),
            anchor="w",
        ).pack(fill="x", padx=12, pady=(8, 4))

        table_frame = tk.Frame(box)
        table_frame.pack(fill="both", expand=True, padx=10, pady=(4, 10))

        columns = ("student", "risk", "anomaly", "evidence", "action")
        table = ttk.Treeview(
            table_frame,
            columns=columns,
            show="headings",
            height=16,
        )
        headings = {
            "student": "Estudiante",
            "risk": "Riesgo",
            "anomaly": "Anomalía",
            "evidence": "Evidencia",
            "action": "Acción docente",
        }
        widths = {
            "student": 145,
            "risk": 105,
            "anomaly": 75,
            "evidence": 360,
            "action": 430,
        }
        for column in columns:
            table.heading(column, text=headings[column])
            table.column(column, width=widths[column], anchor="w")

        table.tag_configure("high", background="#ffd9d9")
        table.tag_configure("medium", background="#fff0c2")
        table.tag_configure("low", background="#dcf5df")

        for row in estudiantes:
            evidence = "; ".join(row.get("reasons", []))
            risk = f"{row.get('risk_label', 'N/A')} ({row.get('risk_score', 0):.1f})"
            table.insert(
                "",
                "end",
                values=(
                    row.get("student_name", row.get("student_id", "N/A")),
                    risk,
                    "Sí" if row.get("anomaly") else "No",
                    evidence,
                    row.get("teacher_recommendation", "Sin recomendación"),
                ),
                tags=(row.get("risk_level", "low"),),
            )

        y_scroll = ttk.Scrollbar(table_frame, orient="vertical", command=table.yview)
        x_scroll = ttk.Scrollbar(table_frame, orient="horizontal", command=table.xview)
        table.configure(yscrollcommand=y_scroll.set, xscrollcommand=x_scroll.set)

        table.grid(row=0, column=0, sticky="nsew")
        y_scroll.grid(row=0, column=1, sticky="ns")
        x_scroll.grid(row=1, column=0, sticky="ew")
        table_frame.grid_rowconfigure(0, weight=1)
        table_frame.grid_columnconfigure(0, weight=1)

    # =========================
    # REEVALUAR
    # =========================
    def ejecutar_evaluacion(self):
        nuevos_resultados = self.evaluar_otro()

        # 🔥 limpiar la interfaz actual
        for widget in self.root.winfo_children():
            widget.destroy()

        # 🔥 actualizar datos
        self.resultados = nuevos_resultados

        # 🔥 reconstruir UI
        self.crear_interfaz()

    # =========================
    # GRÁFICO
    # =========================
    def crear_grafico_importancia(
        self,
        frame,
        importancias,
        titulo="Importancia de Variables",
    ):

        fig, ax = plt.subplots(figsize=(7, 4))

        importancias_filtradas = {
            k: v for k, v in importancias.items()
            if k != "nivel_logico"
        }

        if not importancias_filtradas:
            return

        columnas = list(importancias_filtradas.keys())
        valores = list(importancias_filtradas.values())

        columnas_valores = sorted(zip(valores, columnas), reverse=True)
        valores_ordenados, columnas_ordenadas = zip(*columnas_valores)

        ax.barh(columnas_ordenadas, valores_ordenados)

        ax.set_title(titulo, fontsize=12, fontweight="bold")
        ax.set_xlabel("Importancia")

        ax.invert_yaxis()
        ax.grid(axis='x', linestyle='--', alpha=0.5)

        fig.tight_layout()

        canvas = FigureCanvasTkAgg(fig, master=frame)
        canvas.draw()
        canvas.get_tk_widget().pack(pady=10)

        plt.close(fig)
# =========================
#  LAUNCHER
# =========================
def mostrar_resultados(resultados, evaluar_otro=None):
    root = tk.Tk()
    app = AppResultados(root, resultados, evaluar_otro)
    root.mainloop()
