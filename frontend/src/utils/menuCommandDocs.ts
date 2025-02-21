// MENU 编辑器语法帮助映射
import {MPN, PARTS_COLOR} from "./ConstCOM3D2";
import i18n from "./i18n"; // 需要引入 i18n 实例，否则直接使用 t 时，翻译还未加载

export const menuCommandDocs: Record<string, string> = {
    "メニューフォルダ": i18n.t('MenuEditor.commands.メニューフォルダ'),
    "category": i18n.t('MenuEditor.commands.category'),
    "属性追加": i18n.t('MenuEditor.commands.属性追加'),
    "catno": i18n.t('MenuEditor.commands.catno'),
    "priority": i18n.t('MenuEditor.commands.priority'),
    "name": i18n.t('MenuEditor.commands.name'),
    "setumei": i18n.t('MenuEditor.commands.setumei'),
    "icons": i18n.t('MenuEditor.commands.icons'),
    "icon": i18n.t('MenuEditor.commands.icon'),
    "iconl": i18n.t('MenuEditor.commands.iconl'),
    "onclickmenu": i18n.t('MenuEditor.commands.onclickmenu'),
    "消去node設定開始": i18n.t('MenuEditor.commands.消去node設定開始'),
    "消去node設定終了": i18n.t('MenuEditor.commands.消去node設定終了'),
    "node消去": i18n.t('MenuEditor.commands.node消去'),
    "setstr": i18n.t('MenuEditor.commands.setstr'),
    "color_set": i18n.t('MenuEditor.commands.color_set'),
    "tex": i18n.t('MenuEditor.commands.tex'),
    "マテリアル変更": i18n.t('MenuEditor.commands.マテリアル変更'),
    "アイテムパラメータ": i18n.t('MenuEditor.commands.アイテムパラメータ'),
    "additem": i18n.t('MenuEditor.commands.additem'),
    "delitem": i18n.t('MenuEditor.commands.delitem'),
    "saveitem": i18n.t('MenuEditor.commands.saveitem'),
    "collabo": i18n.t('MenuEditor.commands.collabo'),
};

export const enumMap: Record<string, string[]> = {
    "category": Object.keys(MPN).filter(k => isNaN(Number(k))),
    "color_set": Object.keys(PARTS_COLOR).filter(k => isNaN(Number(k))),
    "メニューフォルダ": ["BODY", "DRESS", "HEAD", "MAN", "system"],
};


export const commandSnippetMap: Record<string, string[]> = {
    "name": [i18n.t('MenuEditor.snippet.name')],
    "setumei": [i18n.t('MenuEditor.snippet.setumei')],
    "priority": ["90135"],
    "catno": ["0"],
    "category": [i18n.t('MenuEditor.snippet.MPN')],
    "additem": [i18n.t('MenuEditor.snippet.model_filename'), i18n.t('MenuEditor.snippet.MPN')],
    "icon": [i18n.t('MenuEditor.snippet.icon_filename')],
    "icons": [i18n.t('MenuEditor.snippet.icon_filename')],
    "maskitem": [i18n.t('MenuEditor.snippet.MPN')],
    "マテリアル変更":[i18n.t('MenuEditor.snippet.MPN'), i18n.t('MenuEditor.snippet.mate_number'), i18n.t('MenuEditor.snippet.mate_filename')],
    "tex": [i18n.t('MenuEditor.snippet.MPN'), i18n.t('MenuEditor.snippet.mate_number'), i18n.t('MenuEditor.snippet.mate_filename')],
    "node消去": [i18n.t('MenuEditor.snippet.bone_name_keyword')],
    "カテゴリ名":[i18n.t('MenuEditor.snippet.MPN'),i18n.t('MenuEditor.snippet.mate_number'),i18n.t('MenuEditor.snippet.mate_name'),i18n.t('MenuEditor.snippet.layer_number'),i18n.t('MenuEditor.snippet.tex_filename'),],
};


