#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Author: 90135
# License: The Unlicense
# Creation date: 2024-11-28
# Version: 2025-02-03_01

import io
import struct
import os
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class Menu:
    version: int
    text_path: str
    name: str
    category: str
    description: str
    attrs: Dict[str, List[list]]


# 读取字符串的辅助函数
def read_str(f: io.BytesIO) -> str:
    length = struct.unpack('<B', f.read(1))[0]
    return f.read(length).decode('utf-8')


# 写入字符串的辅助函数
def dump_str(s: str) -> bytes:
    encoded = s.encode('utf-8')
    return struct.pack('<B', len(encoded)) + encoded


# 从字节数据加载菜单对象
def load_menu(b: bytes) -> Menu:
    f = io.BytesIO(b)
    assert read_str(f) == 'CM3D2_MENU'  # 验证文件头
    version = struct.unpack('<i', f.read(4))[0]
    text_path = read_str(f)
    name = read_str(f)
    category = read_str(f)
    description = read_str(f)
    length, = struct.unpack('<i', f.read(4))
    attrs = {}
    for _ in range(99999):
        c = []
        n = ord(f.read(1))
        if n == 0:
            break
        for _ in range(n):
            c.append(read_str(f))
        attrs.setdefault(c[0], []).append(c[1:])
    return Menu(version, text_path, name, category, description, attrs)


# 将菜单对象转储为字节数据
def dump_menu(menu: Menu) -> bytes:
    f = io.BytesIO()
    f.write(dump_str('CM3D2_MENU'))
    f.write(struct.pack('<i', menu.version))
    f.write(dump_str(menu.text_path))
    f.write(dump_str(menu.name))
    f.write(dump_str(menu.category))
    f.write(dump_str(menu.description))
    f2 = io.BytesIO()
    for k, v in menu.attrs.items():
        for i in v:
            f2.write(struct.pack('<B', len(i) + 1))
            f2.write(dump_str(k))
            for j in i:
                f2.write(dump_str(j))
    f2.write(struct.pack('<B', 0))
    f2v = f2.getvalue()
    f.write(struct.pack('<i', len(f2v)))
    f.write(f2v)
    return f.getvalue()


# 功能1：转换 .menu 和 .txt 文件
def convert_file(file_path: str):
    if file_path.endswith('.menu'):
        with open(file_path, 'rb') as f:
            data = f.read()
            menu = load_menu(data)  # 解析 .menu 文件
            txt_file_path = file_path.replace('.menu', '.txt')
            with open(txt_file_path, 'w', encoding='utf-8') as txt_file:
                txt_file.write(f"Version: {menu.version}\n")
                txt_file.write(f"Text Path: {menu.text_path}\n")
                txt_file.write(f"Name: {menu.name}\n")
                txt_file.write(f"Category: {menu.category}\n")
                txt_file.write(f"Description: {menu.description}\n")
                txt_file.write("Attributes:\n")
                for key, values in menu.attrs.items():
                    for value in values:
                        txt_file.write(f"  {key}: {', '.join(value)}\n")
        print(f"Converted {file_path} to .txt format.")
    elif file_path.endswith('.txt'):
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            version = 1  # 默认版本
            text_path = lines[1].strip().split(': ')[1]
            name = lines[2].strip().split(': ')[1]
            category = lines[3].strip().split(': ')[1]
            description = lines[4].strip().split(': ')[1]
            attrs = {}
            current_key = None
            for line in lines[6:]:
                if line.strip():
                    if line.strip().startswith('  '):
                        key, *values = line.strip().split(': ')
                        attrs.setdefault(key, []).append(values)
            menu = Menu(version, text_path, name, category, description, attrs)
            menu_data = dump_menu(menu)
            menu_file_path = file_path.replace('.txt', '.menu')
            with open(menu_file_path, 'wb') as menu_file:
                menu_file.write(menu_data)
        print(f"Converted {file_path} to .menu format.")


# 功能2：替换文件中的字符串
def replace_keywords_in_menu_files(directory: str, old_str: str, new_str: str):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.menu'):
                print("正在处理 {}".format(file))
                file_path = os.path.join(root, file)
                with open(file_path, 'rb') as f:
                    data = f.read()
                    menu = load_menu(data)
                    # 替换关键词
                    menu.text_path = menu.text_path.replace(old_str, new_str)
                    menu.name = menu.name.replace(old_str, new_str)
                    menu.category = menu.category.replace(old_str, new_str)
                    menu.description = menu.description.replace(old_str, new_str)
                    # 替换属性中的关键词
                    for key, values in menu.attrs.items():
                        menu.attrs[key] = [
                            [v.replace(old_str, new_str) for v in value] for value in values
                        ]
                    # 导出并覆盖原文件
                    updated_data = dump_menu(menu)
                    with open(file_path, 'wb') as f_out:
                        f_out.write(updated_data)
                    print(f"Replaced keywords in {file_path}")


def show_attrs_from_menu_files(directory: str):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.menu'):
                file_path = os.path.join(root, file)
                with open(file_path, 'rb') as f:
                    data = f.read()
                    menu = load_menu(data)
                    for key, values in menu.attrs.items():
                        for value in values:
                            print(f"可选 attrs 属性：{key}: {value}")
                break
        break  # 展示一个就够了


# 功能3：批量删除 attrs 属性
def delete_attrs_from_menu_files(directory: str, attrs_to_delete: List[str]):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.menu'):
                file_path = os.path.join(root, file)
                with open(file_path, 'rb') as f:
                    data = f.read()
                    menu = load_menu(data)
                    # 删除指定的 attrs 属性
                    for attr in attrs_to_delete:
                        if attr in menu.attrs:
                            del menu.attrs[attr]
                            print(f"Deleted attribute '{attr}' from {file_path}")
                    # 导出并覆盖原文件
                    updated_data = dump_menu(menu)
                    with open(file_path, 'wb') as f_out:
                        f_out.write(updated_data)
                    print(f"Updated {file_path}")


# 功能4：重命名文件
def rename_files_in_directory(directory: str, old_str: str, new_str: str):
    for root, _, files in os.walk(directory):
        for file in files:
            if old_str in file:
                old_file_path = os.path.join(root, file)
                new_file_path = os.path.join(root, file.replace(old_str, new_str))
                os.rename(old_file_path, new_file_path)
                print(f"Renamed {old_file_path} to {new_file_path}")

# 功能5：批量删除 attrs 属性并重命名文件（功能3和4的合集）
def delete_attrs_and_rename_files(directory: str, attrs_to_delete: List[str], old_str: str, new_str: str):
    # 先删除指定的 attrs 属性
    delete_attrs_from_menu_files(directory, attrs_to_delete)
    # 再进行文件重命名
    rename_files_in_directory(directory, old_str, new_str)

# 功能6：批量替换文件内容中的关键词并重命名文件（功能2和4的合集）
def replace_keywords_and_rename_files(directory: str, old_str: str, new_str: str):
    # 先替换文件内容中的关键词
    replace_keywords_in_menu_files(directory, old_str, new_str)
    # 再重命名文件
    rename_files_in_directory(directory, old_str, new_str)

# 功能7：在功能6基础上扩展——对指定文件夹中的每个文件，生成多个副本，
# 每个副本中将旧关键词替换为不同的新关键词（例如 accXXX 替换为 accVag、accHana 等）
def replace_keywords_and_duplicate_files(directory: str, old_str: str, new_strs: List[str]):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.menu'):
                file_path = os.path.join(root, file)
                # 读取原始文件数据，作为制作副本的基础
                with open(file_path, 'rb') as f:
                    original_data = f.read()
                for new_str in new_strs:
                    menu = load_menu(original_data)
                    # 替换文件内容中的关键词
                    menu.text_path = menu.text_path.replace(old_str, new_str)
                    menu.name = menu.name.replace(old_str, new_str)
                    menu.category = menu.category.replace(old_str, new_str)
                    menu.description = menu.description.replace(old_str, new_str)
                    for key, values in menu.attrs.items():
                        menu.attrs[key] = [
                            [v.replace(old_str, new_str) for v in value] for value in values
                        ]
                    new_data = dump_menu(menu)
                    # 生成新的文件名：
                    if old_str in file:
                        new_file_name = file.replace(old_str, new_str)
                    else:
                        base, ext = os.path.splitext(file)
                        new_file_name = f"{base}_{new_str}{ext}"
                    new_file_path = os.path.join(root, new_file_name)
                    with open(new_file_path, 'wb') as out_f:
                        out_f.write(new_data)
                    print(f"Created new file: {new_file_path}")

if __name__ == "__main__":
    # 询问用户选择功能
    print("请选择功能：")
    print("1. 转换 .menu 与 .txt 格式")
    print("2. 替换 .menu 文件中的关键词")
    print("3. 批量删除 attrs 属性")
    print("4. 批量重命名文件")
    print("5. 批量删除 attrs 属性并重命名文件 (功能3和4的合集)")
    print("6. 批量替换文件内容关键词并重命名文件 (功能2和4的合集)")
    print("7. 批量替换关键词并生成多个副本 (在功能6基础上扩展)")

    choice = input("输入功能编号: ")

    if choice == '1':
        file_path = input("请输入文件路径：")
        convert_file(file_path)
    elif choice == '2':
        directory = input("请输入文件夹路径：")
        while True:
            old_str = input("请输入要替换的旧关键词(直接按回车结束操作)：")
            if old_str == '':
                break
            new_str = input("请输入新关键词：")
            replace_keywords_in_menu_files(directory, old_str, new_str)
    elif choice == '3':
        directory = input("请输入文件夹路径：")
        show_attrs_from_menu_files(directory)
        attrs_to_delete = input("请输入要删除的 attrs 属性（用逗号分隔）：").split(',')
        delete_attrs_from_menu_files(directory, [attr.strip() for attr in attrs_to_delete if attr.strip()])
    elif choice == '4':
        directory = input("请输入文件夹路径：")
        old_str = input("请输入要替换的旧文件名关键词：")
        new_str = input("请输入新文件名关键词：")
        rename_files_in_directory(directory, old_str, new_str)
    elif choice == '5':
        directory = input("请输入文件夹路径：")
        print("展示可选的 attrs 属性：")
        show_attrs_from_menu_files(directory)
        attrs_to_delete = input("请输入要删除的 attrs 属性（用逗号分隔）：").split(',')
        old_str = input("请输入要替换的旧文件名关键词：")
        new_str = input("请输入新文件名关键词：")
        delete_attrs_and_rename_files(directory, [attr.strip() for attr in attrs_to_delete if attr.strip()], old_str, new_str)
    elif choice == '6':
        directory = input("请输入文件夹路径：")
        old_str = input("请输入要替换的旧关键词（同时用于文件内容和文件名）：")
        new_str = input("请输入新关键词：")
        replace_keywords_and_rename_files(directory, old_str, new_str)
    elif choice == '7':
        directory = input("请输入文件夹路径：")
        old_str = input("请输入要替换的旧关键词：")
        new_strs_input = input("请输入多个新关键词（用逗号分隔）：")
        # 将输入的新关键词列表处理成列表形式
        new_strs = [s.strip() for s in new_strs_input.split(',') if s.strip()]
        replace_keywords_and_duplicate_files(directory, old_str, new_strs)
    else:
        print("无效的选项")