// From COM3D2 2.41.1
// MPN enum
export enum MPN {
    "null_mpn", "MuneL", "MuneS", "MuneTare", "RegFat", "ArmL", "Hara", "RegMeet",
    "KubiScl", "UdeScl", "EyeScl", "EyeSclX", "EyeSclY", "EyePosX", "EyePosY",
    "EyeClose", "EyeBallPosX", "EyeBallPosY", "EyeBallSclX", "EyeBallSclY",
    "EarNone", "EarElf", "EarRot", "EarScl", "NosePos", "NoseScl", "FaceShape",
    "FaceShapeSlim", "MayuShapeIn", "MayuShapeOut", "MayuX", "MayuY", "MayuRot",
    "HeadX", "HeadY", "DouPer", "sintyou", "koshi", "kata", "west", "MuneUpDown",
    "MuneYori", "MuneYawaraka", "MayuThick", "MayuLong", "Yorime", "MabutaUpIn",
    "MabutaUpIn2", "MabutaUpMiddle", "MabutaUpOut", "MabutaUpOut2", "MabutaLowIn",
    "MabutaLowUpMiddle", "MabutaLowUpOut", "body", "moza", "head", "hairf",
    "hairr", "hairt", "hairs", "hairaho", "haircolor", "skin", "acctatoo",
    "accnail", "underhair", "hokuro", "mayu", "lip", "eye", "eye_hi", "eye_hi_r",
    "chikubi", "chikubicolor", "eyewhite", "nose", "facegloss", "matsuge_up",
    "matsuge_low", "futae", "wear", "skirt", "mizugi", "bra", "panz", "stkg",
    "shoes", "headset", "glove", "acchead", "accha", "acchana", "acckamisub",
    "acckami", "accmimi", "accnip", "acckubi", "acckubiwa", "accheso", "accude",
    "accashi", "accsenaka", "accshippo", "accanl", "accvag", "megane", "accxxx",
    "handitem", "acchat", "onepiece", "set_maidwear", "set_mywear",
    "set_underwear", "set_body", "set_head_slider", "folder_eye", "folder_mayu",
    "folder_underhair", "folder_skin", "folder_eyewhite", "folder_matsuge_up",
    "folder_matsuge_low", "folder_futae", "kousoku_upper", "kousoku_lower",
    "seieki_naka", "seieki_hara", "seieki_face", "seieki_mune", "seieki_hip",
    "seieki_ude", "seieki_ashi"
}


// From COM3D2 2.41.1
// Default slot name
// [
//     "head",     # Slot name
//     "_ROOT_",   # The bound root node name
//     "head_hit", # Collision detection node name
//     "body",     # Next slot name
//     "_ROOT_",
//     "body_hit",
//     "end"       # End mark
// ]
//
export const m_strDefSlotName: string[] = [
    "body", "_ROOT_", "IK",
    "head", "Bip01 Head", "Jyouhanshin",
    "eye", "Bip01 Head", "Jyouhanshin",
    "hairF", "Bip01 Head", "Jyouhanshin",
    "hairR", "Bip01 Head", "Jyouhanshin",
    "hairS", "Bip01 Head", "Jyouhanshin",
    "hairT", "Bip01 Head", "Jyouhanshin",
    "wear", "_ROOT_", "Uwagi",
    "skirt", "_ROOT_", "Kahanshin",
    "onepiece", "_ROOT_", "Kahanshin",
    "mizugi", "_ROOT_", "Kahanshin",
    "panz", "_ROOT_", "Kahanshin",
    "bra", "_ROOT_", "Jyouhanshin",
    "stkg", "_ROOT_", "Kahanshin",
    "shoes", "_ROOT_", "Kahanshin",
    "headset", "Bip01 Head", "Jyouhanshin",
    "glove", "_ROOT_", "Uwagi",
    "accHead", "Bip01 Head", "Jyouhanshin",
    "hairAho", "Bip01 Head", "Jyouhanshin",
    "accHana", "_ROOT_", "Jyouhanshin",
    "accHa", "Bip01 Head", "Jyouhanshin",
    "accKami_1_", "Bip01 Head", "Jyouhanshin",
    "accMiMiR", "Bip01 Head", "Jyouhanshin",
    "accKamiSubR", "Bip01 Head", "Jyouhanshin",
    "accNipR", "_ROOT_", "Uwagi",
    "HandItemR", "_IK_handR", "Uwagi",
    "accKubi", "Bip01 Spine1a", "Jyouhanshin",
    "accKubiwa", "Bip01 Neck", "Jyouhanshin",
    "accHeso", "Bip01 Head", "Jyouhanshin",
    "accUde", "_ROOT_", "Uwagi",
    "accAshi", "_ROOT_", "Uwagi",
    "accSenaka", "_ROOT_", "Uwagi",
    "accShippo", "Bip01 Spine", "Uwagi",
    "accAnl", "_ROOT_", "Uwagi",
    "accVag", "_ROOT_", "Uwagi",
    "kubiwa", "_ROOT_", "Uwagi",
    "megane", "Bip01 Head", "Jyouhanshin",
    "accXXX", "_ROOT_", "Uwagi",
    "chinko", "Bip01 Pelvis", "Uwagi",
    "chikubi", "_ROOT_", "Jyouhanshin",
    "accHat", "Bip01 Head", "Jyouhanshin",
    "kousoku_upper", "_ROOT_", "Uwagi",
    "kousoku_lower", "_ROOT_", "Kahanshin",
    "seieki_naka", "_ROOT_", "Uwagi",
    "seieki_hara", "_ROOT_", "Uwagi",
    "seieki_face", "_ROOT_", "Uwagi",
    "seieki_mune", "_ROOT_", "Uwagi",
    "seieki_hip", "_ROOT_", "Uwagi",
    "seieki_ude", "_ROOT_", "Uwagi",
    "seieki_ashi", "_ROOT_", "Uwagi",
    "accNipL", "_ROOT_", "Uwagi",
    "accMiMiL", "Bip01 Head", "Jyouhanshin",
    "accKamiSubL", "Bip01 Head", "Jyouhanshin",
    "accKami_2_", "Bip01 Head", "Jyouhanshin",
    "accKami_3_", "Bip01 Head", "Jyouhanshin",
    "HandItemL", "_IK_handL", "Uwagi",
    "underhair", "_ROOT_", "Kahanshin",
    "moza", "_ROOT_", "Kahanshin",
    "end"
]


// From COM3D2 2.41.1
// Parts color
// for infinite color
export enum PARTS_COLOR {
    NONE = -1,
    EYE_L,
    EYE_R,
    HAIR,
    EYE_BROW,
    UNDER_HAIR,
    SKIN,
    NIPPLE,
    HAIR_OUTLINE,
    SKIN_OUTLINE,
    EYE_WHITE,
    MATSUGE_UP,
    MATSUGE_LOW,
    FUTAE,
    MAX
}


// COM3D2 文件头常量
export const COM3D2HeaderConstants = {
    MenuSignature: "CM3D2_MENU",
    MenuVersion: 1000,
    MateSignature: "CM3D2_MATERIAL",
    MateVersion: 2001,
    PMatSignature: "CM3D2_PMATERIAL",
    PMatVersion: 1000,
    ColSignature: "CM3D21_COL",
    ColVersion: 24201,
    PhySignature: "CM3D21_PHY",
    PhyVersion: 24201,
    TexSignature: "CM3D2_TEX",
    TexVersion: 1010,
    AnmSignature: "CM3D2_ANIM",
    AnmVersion: 1001,

    endByte: 0x00,
    MateEndString: "end"
} as const;