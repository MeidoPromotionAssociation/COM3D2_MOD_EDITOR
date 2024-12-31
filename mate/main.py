#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Author: 10935336
# License: The Unlicense
import ctypes
import tkinter
import tkinter as tk
import tkinter.filedialog as fd
import tkinter.messagebox as mb
import os
import struct
import io
from dataclasses import dataclass
from typing import List, Dict, Tuple

@dataclass
class Mate:
    version: int
    name1: str
    name2: str
    shader1: str
    shader2: str
    texture: Dict[str, tuple]  # 例如: {"mainTex": ("tex2d", "tex/path.png", "UV1", (1.0,1.0,1.0,1.0))}
    color: Dict[str, tuple]    # 例如: {"colorName": (1.0,1.0,1.0,1.0)}
    flt: Dict[str, float]      # 例如: {"param1": 0.5}


def dump_str(s: str) -> bytes:
    size = len(s.encode('utf-8'))
    return struct.pack('<B', size) + s.encode('utf-8')

def read_str(f: io.BytesIO) -> str:
    length = struct.unpack('<B', f.read(1))[0]
    return f.read(length).decode('utf-8')

def load_mate(b: bytes) -> Mate:
    f = io.BytesIO(b)
    assert read_str(f) == 'CM3D2_MATERIAL'
    version = struct.unpack('<i', f.read(4))[0]
    name1, name2, shader1, shader2 = read_str(f), read_str(f), read_str(f), read_str(f)

    texture = {}
    color = {}
    flt = {}
    for _ in range(99999):
        content_type = read_str(f)
        if content_type == 'end':
            break
        key = read_str(f)
        if content_type == 'tex':
            tex_type = read_str(f)
            c = [tex_type]
            if tex_type == 'tex2d':
                # 读取: 路径, uv名称, 4个float
                path = read_str(f)
                uv_name = read_str(f)
                floats = struct.unpack('<4f', f.read(4 * 4))
                c.extend([path, uv_name, floats])
                # 例如 c=["tex2d", "path/to.tex", "UV1", (1.0,1.0,1.0,1.0)]
            texture[key] = tuple(c)
        elif content_type == 'col':
            color[key] = struct.unpack('<4f', f.read(4 * 4))
        elif content_type == 'f':
            flt[key] = struct.unpack('<f', f.read(4))[0]
        else:
            raise Exception('Unknown content type: ' + content_type)

    return Mate(version, name1, name2, shader1, shader2, texture, color, flt)

def dump_mate(mate: Mate) -> bytes:
    f = io.BytesIO()
    f.write(dump_str('CM3D2_MATERIAL'))
    f.write(struct.pack('<i', mate.version))
    for i in [mate.name1, mate.name2, mate.shader1, mate.shader2]:
        f.write(dump_str(i))

    # 写入 texture
    for k, v in mate.texture.items():
        f.write(dump_str('tex'))
        f.write(dump_str(k))
        # v 结构类似 ("tex2d", "xxx.png", "UV", (1.0,1.0,1.0,1.0))
        # 先写 v[0] => tex2d
        f.write(dump_str(v[0]))
        if v[0] == 'tex2d':
            # 后面依次写路径、uv_name、4个float
            f.write(dump_str(v[1]))
            f.write(dump_str(v[2]))
            f.write(struct.pack('<4f', *v[3]))

    # 写入 color
    for k, v in mate.color.items():
        f.write(dump_str('col'))
        f.write(dump_str(k))
        f.write(struct.pack('<4f', *v))

    # 写入 flt
    for k, v in mate.flt.items():
        f.write(dump_str('f'))
        f.write(dump_str(k))
        f.write(struct.pack('<f', v))

    # 最后写 end
    f.write(dump_str('end'))
    return f.getvalue()

# -----------------------------
#   2. GUI 主类
# -----------------------------
class MateEditorGUI:
    def __init__(self, master: tk.Tk):
        self.master = master
        self.master.title("Mate Editor - Texture Vertical Layout")

        self.current_mate: Mate = None
        self.current_file_path = None

        self.create_widgets()
        self.bind_shortcuts()

    def create_widgets(self):
        # Top Buttons
        frm_top = tk.Frame(self.master)
        frm_top.pack(fill=tk.X, pady=5)

        btn_open = tk.Button(frm_top, text="Open .mate", command=self.on_open_file)
        btn_open.pack(side=tk.LEFT, padx=5)
        btn_save = tk.Button(frm_top, text="Save", command=self.on_save_file)
        btn_save.pack(side=tk.LEFT, padx=5)

        # Basic Info
        frm_base = tk.LabelFrame(self.master, text="Basic Info", padx=5, pady=5)
        frm_base.pack(fill=tk.X, padx=5, pady=5)

        row = 0
        tk.Label(frm_base, text="Version").grid(row=row, column=0, sticky=tk.W)
        self.var_version = tk.StringVar()
        tk.Entry(frm_base, textvariable=self.var_version, width=10).grid(row=row, column=1, padx=5)
        row += 1

        tk.Label(frm_base, text="Name1").grid(row=row, column=0, sticky=tk.W)
        self.var_name1 = tk.StringVar()
        tk.Entry(frm_base, textvariable=self.var_name1, width=30).grid(row=row, column=1, padx=5)
        row += 1

        tk.Label(frm_base, text="Pmat").grid(row=row, column=0, sticky=tk.W)
        self.var_name2 = tk.StringVar()
        tk.Entry(frm_base, textvariable=self.var_name2, width=30).grid(row=row, column=1, padx=5)
        row += 1

        tk.Label(frm_base, text="Shader1").grid(row=row, column=0, sticky=tk.W)
        self.var_shader1 = tk.StringVar()
        tk.Entry(frm_base, textvariable=self.var_shader1, width=30).grid(row=row, column=1, padx=5)
        row += 1

        tk.Label(frm_base, text="Shader2").grid(row=row, column=0, sticky=tk.W)
        self.var_shader2 = tk.StringVar()
        tk.Entry(frm_base, textvariable=self.var_shader2, width=30).grid(row=row, column=1, padx=5)
        row += 1

        # Notebook
        import tkinter.ttk as ttk
        self.notebook = ttk.Notebook(self.master)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # 1) Texture Tab
        self.frm_texture_tab = tk.Frame(self.notebook)
        self.notebook.add(self.frm_texture_tab, text="Textures")

        # 1) 在 Textures 标签页里放置一个 canvas + scrollbar
        canvas_tex = tk.Canvas(self.frm_texture_tab)
        scrollbar_tex = tk.Scrollbar(self.frm_texture_tab, orient="vertical", command=canvas_tex.yview)
        canvas_tex.configure(yscrollcommand=scrollbar_tex.set)

        # pack 布局：canvas 在左侧填充，scrollbar 在右侧
        canvas_tex.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar_tex.pack(side=tk.RIGHT, fill=tk.Y)

        # 2) 在 canvas 内创建一个容器 frame，用于放置“texture blocks”
        self.frm_texture_container = tk.Frame(canvas_tex)
        # 让画布随着内部 widget 动态调整滚动区域
        self.frm_texture_container.bind(
            "<Configure>",
            lambda e: canvas_tex.configure(scrollregion=canvas_tex.bbox("all"))
        )
        # 将这个 frame 加到 canvas 里
        canvas_tex.create_window((0, 0), window=self.frm_texture_container, anchor="nw")

        # +号按钮（添加Texture块）放到 self.frm_texture_container 或 frm_texture_tab 均可
        btn_add_tex = tk.Button(self.frm_texture_container, text="+ Add Texture", command=self.add_texture_block)
        btn_add_tex.pack(anchor=tk.W, pady=5)

        # 用来记录 texture block 的列表
        self.texture_blocks = []

        # 2) Color Tab
        self.frm_color_tab = tk.Frame(self.notebook)
        self.notebook.add(self.frm_color_tab, text="Colors")

        tk.Label(self.frm_color_tab, text="Key", width=20).grid(row=0, column=0, padx=5)
        tk.Label(self.frm_color_tab, text="(r,g,b,a)", width=50).grid(row=0, column=1, padx=5)
        btn_add_col = tk.Button(self.frm_color_tab, text="+", command=self.add_col_row)
        btn_add_col.grid(row=0, column=2, padx=5)

        self.col_rows = []  # [(keyVar, rgbaVar, rowIndex), ...]

        # 3) Float Tab
        self.frm_flt_tab = tk.Frame(self.notebook)
        self.notebook.add(self.frm_flt_tab, text="Floats")

        tk.Label(self.frm_flt_tab, text="Key", width=20).grid(row=0, column=0, padx=5)
        tk.Label(self.frm_flt_tab, text="Value", width=50).grid(row=0, column=1, padx=5)
        btn_add_flt = tk.Button(self.frm_flt_tab, text="+", command=self.add_flt_row)
        btn_add_flt.grid(row=0, column=2, padx=5)

        self.flt_rows = []

    def bind_shortcuts(self):
        self.master.bind("<Control-s>", lambda e: self.on_save_file())
        # If you want undo/redo, you can implement them similarly:
        # self.master.bind("<Control-z>", ...)
        # self.master.bind("<Control-Shift-z>", ...)

    # -------------------------------
    #   Texture block (vertical)
    # -------------------------------
    def add_texture_block(self, key="", tex_type="tex2d", path_="", uv_="", ox=0.0, oy=0.0, sx=1.0, sy=1.0):
        """
        Creates a vertical layout block for one texture item:
          Key
          Type
          Path
          UV
          Offset/Scale
          [Delete button]
        """
        block = tk.Frame(self.frm_texture_container, bd=1, relief=tk.SOLID, padx=5, pady=5)
        block.pack(fill=tk.X, expand=True, pady=5)

        # Key
        var_key = tk.StringVar(value=key)
        tk.Label(block, text="Key:").pack(anchor=tk.W)
        tk.Entry(block, textvariable=var_key, width=90).pack(anchor=tk.W, pady=2)

        # Type
        var_type = tk.StringVar(value=tex_type)
        tk.Label(block, text="Type:").pack(anchor=tk.W)
        tk.Entry(block, textvariable=var_type, width=90).pack(anchor=tk.W, pady=2)

        # Path
        var_path = tk.StringVar(value=path_)
        tk.Label(block, text="name:").pack(anchor=tk.W)
        tk.Entry(block, textvariable=var_path, width=90).pack(anchor=tk.W, pady=2)

        # UV
        var_uv = tk.StringVar(value=uv_)
        tk.Label(block, text="Path:").pack(anchor=tk.W)
        tk.Entry(block, textvariable=var_uv, width=90).pack(anchor=tk.W, pady=2)

        # Offset/Scale (two lines or one line, here in one row)
        frm_os = tk.Frame(block)
        frm_os.pack(anchor=tk.W, pady=2)
        tk.Label(frm_os, text="OffsetX:").pack(side=tk.LEFT)
        var_ox = tk.StringVar(value=str(ox))
        tk.Entry(frm_os, textvariable=var_ox, width=6).pack(side=tk.LEFT, padx=2)

        tk.Label(frm_os, text="OffsetY:").pack(side=tk.LEFT)
        var_oy = tk.StringVar(value=str(oy))
        tk.Entry(frm_os, textvariable=var_oy, width=6).pack(side=tk.LEFT, padx=2)

        tk.Label(frm_os, text="ScaleX:").pack(side=tk.LEFT)
        var_sx = tk.StringVar(value=str(sx))
        tk.Entry(frm_os, textvariable=var_sx, width=6).pack(side=tk.LEFT, padx=2)

        tk.Label(frm_os, text="ScaleY:").pack(side=tk.LEFT)
        var_sy = tk.StringVar(value=str(sy))
        tk.Entry(frm_os, textvariable=var_sy, width=6).pack(side=tk.LEFT, padx=2)

        # Delete button
        btn_del = tk.Button(block, text="Delete this Texture", fg="red",
                            command=lambda: self.delete_texture_block(block))
        btn_del.pack(anchor=tk.E, pady=2)

        self.texture_blocks.append((block, var_key, var_type, var_path, var_uv, var_ox, var_oy, var_sx, var_sy))

    def delete_texture_block(self, block_frame):
        """Remove the specified block frame from UI and from self.texture_blocks."""
        found = None
        for tup in self.texture_blocks:
            if tup[0] == block_frame:
                found = tup
                break
        if found:
            self.texture_blocks.remove(found)
        block_frame.destroy()

    # -------------------------------
    #   Color rows (unchanged)
    # -------------------------------
    def add_col_row(self, key="", rgba=(1,1,1,1)):
        row_index = len(self.col_rows) + 1
        keyVar = tk.StringVar(value=key)
        rgbaVar = tk.StringVar(value=", ".join(str(x) for x in rgba))

        tk.Entry(self.frm_color_tab, textvariable=keyVar, width=20).grid(row=row_index, column=0, padx=2, pady=2)
        tk.Entry(self.frm_color_tab, textvariable=rgbaVar, width=70).grid(row=row_index, column=1, padx=2, pady=2)

        btn_del = tk.Button(self.frm_color_tab, text="-", command=lambda: self.delete_col_row(row_index))
        btn_del.grid(row=row_index, column=2, padx=2, pady=2)

        self.col_rows.append((keyVar, rgbaVar, row_index))

    def delete_col_row(self, row_index):
        row_data = None
        for item in self.col_rows:
            if item[2] == row_index:
                row_data = item
                break
        if not row_data:
            return
        for col in range(3):
            wids = self.frm_color_tab.grid_slaves(row=row_index, column=col)
            for w in wids:
                w.destroy()
        self.col_rows.remove(row_data)

    # -------------------------------
    #   Float rows (unchanged)
    # -------------------------------
    def add_flt_row(self, key="", val=0.0):
        row_index = len(self.flt_rows) + 1
        keyVar = tk.StringVar(value=key)
        valVar = tk.StringVar(value=str(val))

        tk.Entry(self.frm_flt_tab, textvariable=keyVar, width=20).grid(row=row_index, column=0, padx=2, pady=2)
        tk.Entry(self.frm_flt_tab, textvariable=valVar, width=70).grid(row=row_index, column=1, padx=2, pady=2)

        btn_del = tk.Button(self.frm_flt_tab, text="-", command=lambda: self.delete_flt_row(row_index))
        btn_del.grid(row=row_index, column=2, padx=2, pady=2)

        self.flt_rows.append((keyVar, valVar, row_index))

    def delete_flt_row(self, row_index):
        row_data = None
        for item in self.flt_rows:
            if item[2] == row_index:
                row_data = item
                break
        if not row_data:
            return
        for col in range(3):
            wids = self.frm_flt_tab.grid_slaves(row=row_index, column=col)
            for w in wids:
                w.destroy()
        self.flt_rows.remove(row_data)

    # -------------------------------
    #   Open/Save + Show/Read
    # -------------------------------
    def on_open_file(self):
        file_path = fd.askopenfilename(
            title="Open .mate file",
            filetypes=[("mate file","*.mate"), ("All files","*.*")]
        )
        if not file_path:
            return
        try:
            with open(file_path,"rb") as f:
                data = f.read()
            mate_obj = load_mate(data)
        except Exception as e:
            mb.showerror("Error", f"Failed to parse .mate:\n{e}")
            return

        self.current_file_path = file_path
        self.current_mate = mate_obj
        mb.showinfo("Info", f"File loaded: {os.path.basename(file_path)}")
        self.show_mate_in_gui()

    def on_save_file(self):
        if not self.current_mate:
            mb.showwarning("Warning","No mate file loaded.")
            return
        self.read_mate_from_gui()

        if not self.current_file_path:
            file_path = fd.asksaveasfilename(
                title="Save .mate file",
                defaultextension=".mate",
                filetypes=[("mate file","*.mate"), ("All files","*.*")]
            )
            if not file_path:
                return
            self.current_file_path = file_path

        try:
            out_data = dump_mate(self.current_mate)
            with open(self.current_file_path,"wb") as fw:
                fw.write(out_data)
            mb.showinfo("Saved", f"Saved to: {os.path.basename(self.current_file_path)}")
        except Exception as e:
            mb.showerror("Error", f"Failed to save:\n{e}")

    def show_mate_in_gui(self):
        """Display current_mate data in the GUI."""
        if not self.current_mate:
            return
        self.var_version.set(str(self.current_mate.version))
        self.var_name1.set(self.current_mate.name1)
        self.var_name2.set(self.current_mate.name2)
        self.var_shader1.set(self.current_mate.shader1)
        self.var_shader2.set(self.current_mate.shader2)

        # Clear old texture blocks
        for block_info in self.texture_blocks:
            block_info[0].destroy()  # block frame
        self.texture_blocks.clear()

        # Rebuild texture blocks
        for k, v in self.current_mate.texture.items():
            if len(v) >= 4:
                # v = (tex_type, path, uvName, (ox, oy, sx, sy))
                self.add_texture_block(
                    key=k,
                    tex_type=v[0],
                    path_=v[1],
                    uv_=v[2],
                    ox=v[3][0], oy=v[3][1], sx=v[3][2], sy=v[3][3]
                )
            else:
                self.add_texture_block(key=k, tex_type=v[0])

        # Clear color rows
        for item in self.col_rows:
            row_i = item[2]
            for col in range(3):
                wids = self.frm_color_tab.grid_slaves(row=row_i, column=col)
                for w in wids:
                    w.destroy()
        self.col_rows.clear()

        # Rebuild color rows
        for k, rgba in self.current_mate.color.items():
            self.add_col_row(k, rgba)

        # Clear float rows
        for item in self.flt_rows:
            row_i = item[2]
            for col in range(3):
                wids = self.frm_flt_tab.grid_slaves(row=row_i, column=col)
                for w in wids:
                    w.destroy()
        self.flt_rows.clear()

        # Rebuild float rows
        for k, val in self.current_mate.flt.items():
            self.add_flt_row(k, val)

    def read_mate_from_gui(self):
        """Gather user input from GUI into self.current_mate."""
        if not self.current_mate:
            return
        # Basic fields
        try:
            self.current_mate.version = int(self.var_version.get().strip())
        except:
            self.current_mate.version = 1000
        self.current_mate.name1 = self.var_name1.get().strip()
        self.current_mate.name2 = self.var_name2.get().strip()
        self.current_mate.shader1 = self.var_shader1.get().strip()
        self.current_mate.shader2 = self.var_shader2.get().strip()

        # Textures
        new_tex = {}
        for (block, var_key, var_type, var_path, var_uv, var_ox, var_oy, var_sx, var_sy) in self.texture_blocks:
            k = var_key.get().strip()
            if not k:
                continue
            ttype = var_type.get().strip()
            path_ = var_path.get().strip()
            uv_   = var_uv.get().strip()
            try:
                ox = float(var_ox.get().strip())
            except:
                ox = 0.0
            try:
                oy = float(var_oy.get().strip())
            except:
                oy = 0.0
            try:
                sx = float(var_sx.get().strip())
            except:
                sx = 1.0
            try:
                sy = float(var_sy.get().strip())
            except:
                sy = 1.0

            if ttype == "tex2d":
                new_tex[k] = (ttype, path_, uv_, (ox, oy, sx, sy))
            else:
                new_tex[k] = (ttype,)

        self.current_mate.texture = new_tex

        # Colors
        new_col = {}
        for (keyVar, rgbaVar, rowIndex) in self.col_rows:
            k = keyVar.get().strip()
            if not k:
                continue
            raw_list = [x.strip() for x in rgbaVar.get().split(',')]
            if len(raw_list) == 4:
                try:
                    c = tuple(float(v) for v in raw_list)
                    new_col[k] = c
                except:
                    pass
        self.current_mate.color = new_col

        # Floats
        new_flt = {}
        for (keyVar, valVar, rowIndex) in self.flt_rows:
            k = keyVar.get().strip()
            if not k:
                continue
            try:
                fval = float(valVar.get().strip())
                new_flt[k] = fval
            except:
                pass
        self.current_mate.flt = new_flt

def main():
    # 告诉操作系统使用程序自身的dpi适配
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
    # 获取屏幕的缩放因子
    scale_factor = ctypes.windll.shcore.GetScaleFactorForDevice(0)
    import tkinter.ttk as ttk
    tk.ttk = ttk

    root = tkinter.Tk()
    app = MateEditorGUI(root)
    # 设置程序缩放
    root.call('tk', 'scaling', scale_factor)
    width = root.winfo_screenwidth()
    height = root.winfo_screenheight()
    root.geometry("%dx%d+%d+%d" % (int(width / 2), int(height / 1.5), int(width / 4), int(height / 4)))
    root.mainloop()





if __name__ == "__main__":
    main()
