export namespace COM3D2 {
	
	export class Keyframe {
	    Time: number;
	    Value: number;
	    InTangent: number;
	    OutTangent: number;
	
	    static createFrom(source: any = {}) {
	        return new Keyframe(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Time = source["Time"];
	        this.Value = source["Value"];
	        this.InTangent = source["InTangent"];
	        this.OutTangent = source["OutTangent"];
	    }
	}
	export class AnimationCurve {
	    Keyframes: Keyframe[];
	
	    static createFrom(source: any = {}) {
	        return new AnimationCurve(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Keyframes = this.convertValues(source["Keyframes"], Keyframe);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BoneValue {
	    BoneName: string;
	    Value: number;
	
	    static createFrom(source: any = {}) {
	        return new BoneValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.BoneName = source["BoneName"];
	        this.Value = source["Value"];
	    }
	}
	export class Col {
	    Signature: string;
	    Version: number;
	    Colliders: any[];
	
	    static createFrom(source: any = {}) {
	        return new Col(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.Colliders = source["Colliders"];
	    }
	}
	export class ColProperty {
	    TypeName: string;
	    PropName: string;
	    Color: number[];
	
	    static createFrom(source: any = {}) {
	        return new ColProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.Color = source["Color"];
	    }
	}
	export class Command {
	    ArgCount: number;
	    Args: string[];
	
	    static createFrom(source: any = {}) {
	        return new Command(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ArgCount = source["ArgCount"];
	        this.Args = source["Args"];
	    }
	}
	export class DynamicBoneColliderBase {
	    ParentName: string;
	    SelfName: string;
	    LocalPosition: number[];
	    LocalRotation: number[];
	    LocalScale: number[];
	    Direction: number;
	    Center: number[];
	    Bound: number;
	
	    static createFrom(source: any = {}) {
	        return new DynamicBoneColliderBase(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ParentName = source["ParentName"];
	        this.SelfName = source["SelfName"];
	        this.LocalPosition = source["LocalPosition"];
	        this.LocalRotation = source["LocalRotation"];
	        this.LocalScale = source["LocalScale"];
	        this.Direction = source["Direction"];
	        this.Center = source["Center"];
	        this.Bound = source["Bound"];
	    }
	}
	export class DynamicBoneCollider {
	    Base?: DynamicBoneColliderBase;
	    Radius: number;
	    Height: number;
	
	    static createFrom(source: any = {}) {
	        return new DynamicBoneCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Base = this.convertValues(source["Base"], DynamicBoneColliderBase);
	        this.Radius = source["Radius"];
	        this.Height = source["Height"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class DynamicBoneMuneCollider {
	    Base?: DynamicBoneColliderBase;
	    Radius: number;
	    Height: number;
	    ScaleRateMulMax: number;
	    CenterRateMax: number[];
	
	    static createFrom(source: any = {}) {
	        return new DynamicBoneMuneCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Base = this.convertValues(source["Base"], DynamicBoneColliderBase);
	        this.Radius = source["Radius"];
	        this.Height = source["Height"];
	        this.ScaleRateMulMax = source["ScaleRateMulMax"];
	        this.CenterRateMax = source["CenterRateMax"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DynamicBonePlaneCollider {
	    Base?: DynamicBoneColliderBase;
	
	    static createFrom(source: any = {}) {
	        return new DynamicBonePlaneCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Base = this.convertValues(source["Base"], DynamicBoneColliderBase);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FProperty {
	    TypeName: string;
	    PropName: string;
	    Number: number;
	
	    static createFrom(source: any = {}) {
	        return new FProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.Number = source["Number"];
	    }
	}
	
	export class Keyword {
	    Key: string;
	    Value: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Keyword(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Key = source["Key"];
	        this.Value = source["Value"];
	    }
	}
	export class KeywordProperty {
	    TypeName: string;
	    PropName: string;
	    Count: number;
	    Keywords: Keyword[];
	
	    static createFrom(source: any = {}) {
	        return new KeywordProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.Count = source["Count"];
	        this.Keywords = this.convertValues(source["Keywords"], Keyword);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Material {
	    Name: string;
	    ShaderName: string;
	    ShaderFilename: string;
	    Properties: any[];
	
	    static createFrom(source: any = {}) {
	        return new Material(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.ShaderName = source["ShaderName"];
	        this.ShaderFilename = source["ShaderFilename"];
	        this.Properties = source["Properties"];
	    }
	}
	export class Mate {
	    Signature: string;
	    Version: number;
	    Name: string;
	    Material?: Material;
	
	    static createFrom(source: any = {}) {
	        return new Mate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.Name = source["Name"];
	        this.Material = this.convertValues(source["Material"], Material);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Menu {
	    Signature: string;
	    Version: number;
	    SrcFileName: string;
	    ItemName: string;
	    Category: string;
	    InfoText: string;
	    BodySize: number;
	    Commands: Command[];
	
	    static createFrom(source: any = {}) {
	        return new Menu(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.SrcFileName = source["SrcFileName"];
	        this.ItemName = source["ItemName"];
	        this.Category = source["Category"];
	        this.InfoText = source["InfoText"];
	        this.BodySize = source["BodySize"];
	        this.Commands = this.convertValues(source["Commands"], Command);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MissingCollider {
	
	
	    static createFrom(source: any = {}) {
	        return new MissingCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class PMat {
	    Signature: string;
	    Version: number;
	    Hash: number;
	    MaterialName: string;
	    RenderQueue: number;
	    Shader: string;
	
	    static createFrom(source: any = {}) {
	        return new PMat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.Hash = source["Hash"];
	        this.MaterialName = source["MaterialName"];
	        this.RenderQueue = source["RenderQueue"];
	        this.Shader = source["Shader"];
	    }
	}
	export class Phy {
	    Signature: string;
	    Version: number;
	    RootName: string;
	    EnablePartialDamping: number;
	    PartialDamping: BoneValue[];
	    Damping: number;
	    DampingDistrib: AnimationCurve;
	    EnablePartialElasticity: number;
	    PartialElasticity: BoneValue[];
	    Elasticity: number;
	    ElasticityDistrib: AnimationCurve;
	    EnablePartialStiffness: number;
	    PartialStiffness: BoneValue[];
	    Stiffness: number;
	    StiffnessDistrib: AnimationCurve;
	    EnablePartialInert: number;
	    PartialInert: BoneValue[];
	    Inert: number;
	    InertDistrib: AnimationCurve;
	    EnablePartialRadius: number;
	    PartialRadius: BoneValue[];
	    Radius: number;
	    RadiusDistrib: AnimationCurve;
	    EndLength: number;
	    EndOffset: number[];
	    Gravity: number[];
	    Force: number[];
	    ColliderFileName: string;
	    CollidersCount: number;
	    ExclusionsCount: number;
	    FreezeAxis: number;
	
	    static createFrom(source: any = {}) {
	        return new Phy(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.RootName = source["RootName"];
	        this.EnablePartialDamping = source["EnablePartialDamping"];
	        this.PartialDamping = this.convertValues(source["PartialDamping"], BoneValue);
	        this.Damping = source["Damping"];
	        this.DampingDistrib = this.convertValues(source["DampingDistrib"], AnimationCurve);
	        this.EnablePartialElasticity = source["EnablePartialElasticity"];
	        this.PartialElasticity = this.convertValues(source["PartialElasticity"], BoneValue);
	        this.Elasticity = source["Elasticity"];
	        this.ElasticityDistrib = this.convertValues(source["ElasticityDistrib"], AnimationCurve);
	        this.EnablePartialStiffness = source["EnablePartialStiffness"];
	        this.PartialStiffness = this.convertValues(source["PartialStiffness"], BoneValue);
	        this.Stiffness = source["Stiffness"];
	        this.StiffnessDistrib = this.convertValues(source["StiffnessDistrib"], AnimationCurve);
	        this.EnablePartialInert = source["EnablePartialInert"];
	        this.PartialInert = this.convertValues(source["PartialInert"], BoneValue);
	        this.Inert = source["Inert"];
	        this.InertDistrib = this.convertValues(source["InertDistrib"], AnimationCurve);
	        this.EnablePartialRadius = source["EnablePartialRadius"];
	        this.PartialRadius = this.convertValues(source["PartialRadius"], BoneValue);
	        this.Radius = source["Radius"];
	        this.RadiusDistrib = this.convertValues(source["RadiusDistrib"], AnimationCurve);
	        this.EndLength = source["EndLength"];
	        this.EndOffset = source["EndOffset"];
	        this.Gravity = source["Gravity"];
	        this.Force = source["Force"];
	        this.ColliderFileName = source["ColliderFileName"];
	        this.CollidersCount = source["CollidersCount"];
	        this.ExclusionsCount = source["ExclusionsCount"];
	        this.FreezeAxis = source["FreezeAxis"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RangeProperty {
	    TypeName: string;
	    PropName: string;
	    Number: number;
	
	    static createFrom(source: any = {}) {
	        return new RangeProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.Number = source["Number"];
	    }
	}
	export class Tex2DSubProperty {
	    Name: string;
	    Path: string;
	    Offset: number[];
	    Scale: number[];
	
	    static createFrom(source: any = {}) {
	        return new Tex2DSubProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Path = source["Path"];
	        this.Offset = source["Offset"];
	        this.Scale = source["Scale"];
	    }
	}
	export class TexOffsetProperty {
	    TypeName: string;
	    PropName: string;
	    OffsetX: number;
	    OffsetY: number;
	
	    static createFrom(source: any = {}) {
	        return new TexOffsetProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.OffsetX = source["OffsetX"];
	        this.OffsetY = source["OffsetY"];
	    }
	}
	export class TexRTSubProperty {
	    DiscardedStr1: string;
	    DiscardedStr2: string;
	
	    static createFrom(source: any = {}) {
	        return new TexRTSubProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DiscardedStr1 = source["DiscardedStr1"];
	        this.DiscardedStr2 = source["DiscardedStr2"];
	    }
	}
	export class TexProperty {
	    TypeName: string;
	    PropName: string;
	    SubTag: string;
	    Tex2D?: Tex2DSubProperty;
	    TexRT?: TexRTSubProperty;
	
	    static createFrom(source: any = {}) {
	        return new TexProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.SubTag = source["SubTag"];
	        this.Tex2D = this.convertValues(source["Tex2D"], Tex2DSubProperty);
	        this.TexRT = this.convertValues(source["TexRT"], TexRTSubProperty);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TexScaleProperty {
	    TypeName: string;
	    PropName: string;
	    ScaleX: number;
	    ScaleY: number;
	
	    static createFrom(source: any = {}) {
	        return new TexScaleProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.ScaleX = source["ScaleX"];
	        this.ScaleY = source["ScaleY"];
	    }
	}
	export class VecProperty {
	    TypeName: string;
	    PropName: string;
	    Vector: number[];
	
	    static createFrom(source: any = {}) {
	        return new VecProperty(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	        this.PropName = source["PropName"];
	        this.Vector = source["Vector"];
	    }
	}

}

export namespace main {
	
	export class VersionCheckResult {
	    CurrentVersion: string;
	    LatestVersion: string;
	    IsNewer: boolean;
	
	    static createFrom(source: any = {}) {
	        return new VersionCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.CurrentVersion = source["CurrentVersion"];
	        this.LatestVersion = source["LatestVersion"];
	        this.IsNewer = source["IsNewer"];
	    }
	}

}

