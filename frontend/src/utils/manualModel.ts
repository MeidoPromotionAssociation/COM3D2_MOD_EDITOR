/**
 * Property 可以是不同类型: tex | col | vec | f
 *
 * Go 里是用 interface + struct 来实现多态；
 * 前端用联合类型
 */
export type Property = TexProperty | ColProperty | VecProperty | FProperty;

export interface Tex2DSubProperty {
    Name: string;
    Path: string;
    Offset: [number, number];
    Scale: [number, number];
}

export interface TexRTSubProperty {
    DiscardedStr1: string;
    DiscardedStr2: string;
}

export interface TexProperty {
    typeName: 'tex';
    PropName: string;
    SubTag: 'tex2d' | 'cube' | 'texRT' | 'null';
    Tex2D?: Tex2DSubProperty;
    TexRT?: TexRTSubProperty;
}

export interface ColProperty {
    typeName: 'col';
    PropName: string;
    Color: [number, number, number, number];
}

export interface VecProperty {
    typeName: 'vec';
    PropName: string;
    Vector: [number, number, number, number];
}

export interface FProperty {
    typeName: 'f';
    PropName: string;
    Number: number;
}