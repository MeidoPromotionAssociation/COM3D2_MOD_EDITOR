// frontend/src/utils/menuCommandDocs.ts
import {MPN, PARTS_COLOR} from "./ConstCOM3D2";
import {t} from "i18next";


// 这是个函数，因为如果直接定义常量，那么加载时 i18n 还没加载好，会导致无翻译
export const getMenuCommandDocs = (): Record<string, string> => ({
    "メニューフォルダ": t('MenuEditor.commands.メニューフォルダ'),
    "category": t('MenuEditor.commands.category'),
    "属性追加": t('MenuEditor.commands.属性追加'),
    "catno": t('MenuEditor.commands.catno'),
    "priority": t('MenuEditor.commands.priority'),
    "name": t('MenuEditor.commands.name'),
    "setumei": t('MenuEditor.commands.setumei'),
    "icons": t('MenuEditor.commands.icons'),
    "icon": t('MenuEditor.commands.icon'),
    "iconl": t('MenuEditor.commands.iconl'),
    "onclickmenu": t('MenuEditor.commands.onclickmenu'),
    "消去node設定開始": t('MenuEditor.commands.消去node設定開始'),
    "消去node設定終了": t('MenuEditor.commands.消去node設定終了'),
    "node消去": t('MenuEditor.commands.node消去'),
    "setstr": t('MenuEditor.commands.setstr'),
    "color_set": t('MenuEditor.commands.color_set'),
    "tex": t('MenuEditor.commands.tex'),
    "マテリアル変更": t('MenuEditor.commands.マテリアル変更'),
    "アイテムパラメータ": t('MenuEditor.commands.アイテムパラメータ'),
    "additem": t('MenuEditor.commands.additem'),
    "delitem": t('MenuEditor.commands.delitem'),
    // "saveitem": t('MenuEditor.commands.saveitem'),
    "collabo": t('MenuEditor.commands.collabo'),
});

export const enumMap: Record<string, string[]> = {
    "category": Object.keys(MPN).filter(k => isNaN(Number(k))),
    "color_set": Object.keys(PARTS_COLOR).filter(k => isNaN(Number(k))),
    "メニューフォルダ": ["BODY", "DRESS", "HEAD", "MAN", "system"],
};


export const getCommandSnippetMap = (): Record<string, string[]> => ({
    "name": [t('MenuEditor.snippet.name')],
    "setumei": [t('MenuEditor.snippet.setumei')],
    "priority": ["90135"],
    "catno": ["0"],
    "category": [t('MenuEditor.snippet.MPN')],
    "additem": [t('MenuEditor.snippet.model_filename'), t('MenuEditor.snippet.MPN')],
    "icon": [t('MenuEditor.snippet.icon_filename')],
    "icons": [t('MenuEditor.snippet.icon_filename')],
    "maskitem": [t('MenuEditor.snippet.MPN')],
    "マテリアル変更":[t('MenuEditor.snippet.MPN'), t('MenuEditor.snippet.mate_number'), t('MenuEditor.snippet.mate_filename')],
    "tex": [t('MenuEditor.snippet.MPN'), t('MenuEditor.snippet.mate_number'), t('MenuEditor.snippet.mate_filename')],
    "node消去": [t('MenuEditor.snippet.bone_name_keyword')],
    "カテゴリ名":[t('MenuEditor.snippet.MPN'),t('MenuEditor.snippet.mate_number'),t('MenuEditor.snippet.mate_name'),t('MenuEditor.snippet.layer_number'),t('MenuEditor.snippet.tex_filename'),],
});


