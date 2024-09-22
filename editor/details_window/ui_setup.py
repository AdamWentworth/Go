# ui_setup.py
import tkinter as tk
from tkinter import ttk

def create_scrollable_window(parent, title):
    window = tk.Toplevel(parent)
    window.title(title)
    window.state('zoomed')

    canvas = tk.Canvas(window)
    scrollable_frame = ttk.Frame(canvas)

    # Vertical scrollbar
    scrollbar = ttk.Scrollbar(window, orient="vertical", command=canvas.yview)
    canvas.configure(yscrollcommand=scrollbar.set)
    scrollbar.pack(side="right", fill="y")

    # Horizontal scrollbar
    h_scrollbar = ttk.Scrollbar(window, orient="horizontal", command=canvas.xview)
    canvas.configure(xscrollcommand=h_scrollbar.set)
    h_scrollbar.pack(side="bottom", fill="x")

    canvas.pack(side="left", fill="both", expand=True)
    canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")

    scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))

    return window, canvas, scrollable_frame

def bind_scroll_events(window, canvas):
    def _on_mousewheel(event):
        canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def _on_shift_mousewheel(event):
        canvas.xview_scroll(int(-1 * (event.delta / 120)), "units")

    window.bind("<MouseWheel>", _on_mousewheel)
    window.bind("<Shift-MouseWheel>", _on_shift_mousewheel)

