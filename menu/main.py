#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Author: 10935336
# License: The Unlicense
# Creation date: 2024-12-31
# Version: 2024-12-31_01
import ctypes
import io
import struct
import sys
import tkinter
from tkinter import *
from tkinter.ttk import *
import tkinter.filedialog as fd
import tkinter.messagebox as mb
from dataclasses import dataclass
from typing import Dict, List


# -----------------------------
#  以下为 .menu 读写相关函数
# -----------------------------
@dataclass
class Menu:
    version: int
    text_path: str
    name: str
    category: str
    description: str
    attrs: Dict[str, List[List[str]]]

# https://github.com/RimoChan/cm3d2-parser/blob/slave/cm3d2_parser/utils.py
def read_str(file) -> str:
    l = 0
    for i in range(9):
        n, = struct.unpack('<B', file.read(1))
        l += n % 128 * 128 ** i
        if n < 128:
            return file.read(l).decode('utf-8')

# https://github.com/RimoChan/cm3d2-parser/blob/slave/cm3d2_parser/utils.py
def dump_str(s: str) -> bytes:
    b = s.encode('utf-8')
    r = b''
    l = len(b)
    while True:
        if l < 128:
            r += struct.pack('<B', l)
            break
        else:
            r += struct.pack('<B', l % 128 + 128)
            l //= 128
    return r + b


def load_menu(b: bytes) -> Menu:
    f = io.BytesIO(b)

    file_header = read_str(f)
    if file_header != 'CM3D2_MENU':
        raise ValueError("Invalid .menu file header")

    version = struct.unpack('<i', f.read(4))[0]
    text_path = read_str(f)
    name = read_str(f)
    category = read_str(f)
    description = read_str(f)

    length, = struct.unpack('<i', f.read(4))

    attrs = {}
    while True:
        tmp = f.read(1)
        if not tmp:
            break
        n = tmp[0]
        if n == 0:
            break
        c = []
        for _ in range(n):
            c.append(read_str(f))

        key = c[0]
        values = c[1:]
        attrs.setdefault(key, []).append(values)

    return Menu(version, text_path, name, category, description, attrs)


def dump_menu(menu: Menu) -> bytes:
    f = io.BytesIO()
    f.write(dump_str('CM3D2_MENU'))
    f.write(struct.pack('<i', menu.version))
    f.write(dump_str(menu.text_path))
    f.write(dump_str(menu.name))
    f.write(dump_str(menu.category))
    f.write(dump_str(menu.description))

    f2 = io.BytesIO()
    for k, lines in menu.attrs.items():
        for one_line_values in lines:
            f2.write(struct.pack('<B', len(one_line_values) + 1))
            f2.write(dump_str(k))
            for val in one_line_values:
                f2.write(dump_str(val))
    f2.write(struct.pack('<B', 0))

    f2v = f2.getvalue()
    f.write(struct.pack('<i', len(f2v)))
    f.write(f2v)
    return f.getvalue()


# -----------------------------
#    显示/解析两种格式的辅助
# -----------------------------
def attrs_to_text_format1(attrs: Dict[str, List[List[str]]]) -> str:
    lines = []
    for key, list_of_val_lists in attrs.items():
        for val_list in list_of_val_lists:
            lines.append(key)
            for val in val_list:
                lines.append(f"\t{val}")
            lines.append("")
    return "\n".join(lines).strip()


def attrs_to_text_format2(attrs: Dict[str, List[List[str]]]) -> str:
    lines = []
    for key, list_of_val_lists in attrs.items():
        for val_list in list_of_val_lists:
            if val_list:
                joined_vals = ", ".join(val_list)
                lines.append(f"{key}: {joined_vals}")
            else:
                lines.append(f"{key}: ")
    return "\n".join(lines)


def parse_text_as_format1(text: str) -> Dict[str, List[List[str]]]:
    lines = text.splitlines()
    attrs = {}
    current_key = None
    current_values = []

    def commit_key(k, vals):
        if k is not None:
            attrs.setdefault(k, []).append(vals)

    for line in lines:
        line = line.rstrip('\r\n')
        if not line.strip():
            if current_key is not None:
                commit_key(current_key, current_values)
                current_key = None
                current_values = []
            continue

        if line.startswith('\t'):
            current_values.append(line.strip())
        else:
            if current_key is not None:
                commit_key(current_key, current_values)
            current_key = line.strip()
            current_values = []

    if current_key is not None:
        commit_key(current_key, current_values)

    return attrs


def parse_text_as_format2(text: str) -> Dict[str, List[List[str]]]:
    lines = text.splitlines()
    attrs = {}
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if ':' not in line:
            continue
        key_part, val_part = line.split(':', 1)
        key_part = key_part.strip()
        val_part = val_part.strip()
        if val_part:
            val_list = [v.strip() for v in val_part.split(',')]
        else:
            val_list = []
        attrs.setdefault(key_part, []).append(val_list)
    return attrs


# -----------------------------
#      GUI 主类 (带快捷键)
# -----------------------------
class MenuEditorGUI:
    def __init__(self, master: tkinter.Tk):
        self.master = master
        self.master.title("Simple COM3D2 .menu Editor by 10935336")

        self.current_menu = None
        self.current_file_path = None

        self.var_display_format = tkinter.StringVar(value='format1')

        self.create_widgets()
        self.bind_shortcuts()

    def create_widgets(self):
        frm_buttons = tkinter.Frame(self.master)
        frm_buttons.pack(fill=tkinter.X, pady=5)

        btn_open = tkinter.Button(frm_buttons, text="打开.menu 文件", command=self.open_menu_file_dialog)
        btn_open.pack(side=tkinter.LEFT, padx=10)

        btn_save = tkinter.Button(frm_buttons, text="保存当前修改(ctrl+s)", command=self.save_menu_file)
        btn_save.pack(side=tkinter.LEFT, padx=10)

        frm_format = tkinter.Frame(self.master)
        frm_format.pack(fill=tkinter.X, padx=10, pady=5)

        tkinter.Label(frm_format, text="选择显示格式: ").pack(side=tkinter.LEFT)
        rb1 = tkinter.Radiobutton(frm_format, text="格式1", variable=self.var_display_format, value='format1',
                             command=self.refresh_attrs_view)
        rb2 = tkinter.Radiobutton(frm_format, text="格式2", variable=self.var_display_format, value='format2',
                             command=self.refresh_attrs_view)
        rb1.pack(side=tkinter.LEFT, padx=5)
        rb2.pack(side=tkinter.LEFT, padx=5)

        frm_fields = tkinter.Frame(self.master)
        frm_fields.pack(fill=tkinter.X, pady=5)

        tkinter.Label(frm_fields, text="Version:").grid(row=0, column=0, sticky=tkinter.W, padx=5, pady=2)
        self.var_version = tkinter.StringVar()
        tkinter.Entry(frm_fields, textvariable=self.var_version, width=100).grid(row=0, column=1, padx=5, pady=2)

        tkinter.Label(frm_fields, text="Text Path:").grid(row=1, column=0, sticky=tkinter.W, padx=5, pady=2)
        self.var_path = tkinter.StringVar()
        tkinter.Entry(frm_fields, textvariable=self.var_path, width=100).grid(row=1, column=1, padx=5, pady=2)

        tkinter.Label(frm_fields, text="Name:").grid(row=2, column=0, sticky=tkinter.W, padx=5, pady=2)
        self.var_name = tkinter.StringVar()
        tkinter.Entry(frm_fields, textvariable=self.var_name, width=100).grid(row=2, column=1, padx=5, pady=2)

        tkinter.Label(frm_fields, text="Category:").grid(row=3, column=0, sticky=tkinter.W, padx=5, pady=2)
        self.var_category = tkinter.StringVar()
        tkinter.Entry(frm_fields, textvariable=self.var_category, width=100).grid(row=3, column=1, padx=5, pady=2)

        tkinter.Label(frm_fields, text="Description:").grid(row=4, column=0, sticky=tkinter.W, padx=5, pady=2)
        self.var_desc = tkinter.StringVar()
        tkinter.Entry(frm_fields, textvariable=self.var_desc, width=100).grid(row=4, column=1, padx=5, pady=2)

        frm_attrs = tkinter.Frame(self.master)
        frm_attrs.pack(fill=tkinter.BOTH, expand=True, pady=5)

        tkinter.Label(frm_attrs, text="Attrs").pack(anchor=tkinter.W, padx=5)

        # 重要：启用 undo=True 以支持撤销/恢复
        self.txt_attrs = tkinter.Text(frm_attrs, width=80, height=15, undo=True)
        self.txt_attrs.pack(fill=tkinter.BOTH, expand=True, padx=5, pady=5)

    def bind_shortcuts(self):
        """
        绑定全局快捷键：
          Ctrl+S => 保存
          Ctrl+Z => 撤销
          Ctrl+Shift+Z => 恢复
        """
        self.master.bind("<Control-s>", self.on_ctrl_s)
        self.master.bind("<Control-z>", self.on_ctrl_z)
        self.master.bind("<Control-Shift-z>", self.on_ctrl_shift_z)

    def on_ctrl_s(self, event=None):
        """快捷键 Ctrl+S => 保存"""
        self.save_menu_file()

    def on_ctrl_z(self, event=None):
        """快捷键 Ctrl+Z => 撤销"""
        try:
            self.txt_attrs.edit_undo()
        except tkinter.TclError as e:
            print(e)
            pass  # 无可撤销时可能会抛异常，可忽略

    def on_ctrl_shift_z(self, event=None):
        """快捷键 Ctrl+Shift+Z => 恢复(Redo)"""
        try:
            self.txt_attrs.edit_redo()
        except tkinter.TclError:
            pass

    def open_menu_file_dialog(self):
        file_path = fd.askopenfilename(
            title="选择 .menu 文件",
            filetypes=[("CM3D2 menu files", "*.menu"), ("All files", "*.*")]
        )
        if not file_path:
            return
        self.open_menu_file_with_path(file_path)


    def open_menu_file_with_path(self, file_path: str):
        try:
            with open(file_path, 'rb') as f:
                data = f.read()
            menu_obj = load_menu(data)
        except Exception as e:
            mb.showerror("错误", f"无法解析此文件:\n{e}")
            return

        self.current_file_path = file_path
        self.current_menu = menu_obj
        self.show_menu_in_gui()

    def show_menu_in_gui(self):
        if not self.current_menu:
            return
        self.var_version.set(str(self.current_menu.version))
        self.var_path.set(self.current_menu.text_path)
        self.var_name.set(self.current_menu.name)
        self.var_category.set(self.current_menu.category)
        self.var_desc.set(self.current_menu.description)
        self.refresh_attrs_view()

    def refresh_attrs_view(self):
        if not self.current_menu:
            return
        self.txt_attrs.delete('1.0', tkinter.END)

        fmt = self.var_display_format.get()
        if fmt == 'format2':
            text = attrs_to_text_format2(self.current_menu.attrs)
        else:
            text = attrs_to_text_format1(self.current_menu.attrs)

        self.txt_attrs.insert(tkinter.END, text)

    def save_menu_file(self):
        if not self.current_menu:
            mb.showwarning("提示", "当前没有可保存的内容，请先打开 .menu 文件。")
            return

        try:
            self.current_menu.version = int(self.var_version.get().strip())
        except ValueError:
            mb.showerror("错误", "Version 必须是整数。")
            return
        self.current_menu.text_path = self.var_path.get().strip()
        self.current_menu.name = self.var_name.get().strip()
        self.current_menu.category = self.var_category.get().strip()
        self.current_menu.description = self.var_desc.get().strip()

        fmt = self.var_display_format.get()
        raw_text = self.txt_attrs.get('1.0', tkinter.END).rstrip('\n\r')

        if fmt == 'format2':
            new_attrs = parse_text_as_format2(raw_text)
        else:
            new_attrs = parse_text_as_format1(raw_text)

        self.current_menu.attrs = new_attrs

        if not self.current_file_path:
            file_path = fd.asksaveasfilename(
                title="另存为 .menu 文件",
                defaultextension=".menu",
                filetypes=[("CM3D2 menu files", "*.menu"), ("All files", "*.*")]
            )
            if not file_path:
                return
            self.current_file_path = file_path
        else:
            file_path = self.current_file_path

        try:
            menu_data = dump_menu(self.current_menu)
            with open(file_path, 'wb') as f:
                f.write(menu_data)
            # mb.showinfo("提示", f"已保存到 {os.path.basename(file_path)}")
        except Exception as e:
            mb.showerror("错误", f"保存失败:\n{e}")


def main():
    # 告诉操作系统使用程序自身的dpi适配
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
    # 获取屏幕的缩放因子
    scale_factor = ctypes.windll.shcore.GetScaleFactorForDevice(0)

    root = tkinter.Tk()
    app = MenuEditorGUI(root)
    # 设置程序缩放
    root.call('tk', 'scaling', scale_factor)
    width = root.winfo_screenwidth()
    height = root.winfo_screenheight()
    root.geometry("%dx%d+%d+%d" % (int(width / 2), int(height / 1.5), int(width / 4), int(height / 4)))

    # If the script is run with a file path (e.g., from file association), open the file automatically
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        app.open_menu_file_with_path(file_path)

    root.mainloop()


if __name__ == "__main__":
    main()
