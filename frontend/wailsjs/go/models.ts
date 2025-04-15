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
	export class PropertyCurve {
	    PropertyIndex: number;
	    Keyframes: Keyframe[];
	
	    static createFrom(source: any = {}) {
	        return new PropertyCurve(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.PropertyIndex = source["PropertyIndex"];
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
	export class BoneCurveData {
	    BonePath: string;
	    PropertyCurves: PropertyCurve[];
	
	    static createFrom(source: any = {}) {
	        return new BoneCurveData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.BonePath = source["BonePath"];
	        this.PropertyCurves = this.convertValues(source["PropertyCurves"], PropertyCurve);
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
	export class Anm {
	    Signature: string;
	    Version: number;
	    BoneCurves: BoneCurveData[];
	    BustKeyLeft: boolean;
	    BustKeyRight: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Anm(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.BoneCurves = this.convertValues(source["BoneCurves"], BoneCurveData);
	        this.BustKeyLeft = source["BustKeyLeft"];
	        this.BustKeyRight = source["BustKeyRight"];
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
	export class Quaternion {
	    X: number;
	    Y: number;
	    Z: number;
	    W: number;
	
	    static createFrom(source: any = {}) {
	        return new Quaternion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.X = source["X"];
	        this.Y = source["Y"];
	        this.Z = source["Z"];
	        this.W = source["W"];
	    }
	}
	export class Vector3 {
	    X: number;
	    Y: number;
	    Z: number;
	
	    static createFrom(source: any = {}) {
	        return new Vector3(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.X = source["X"];
	        this.Y = source["Y"];
	        this.Z = source["Z"];
	    }
	}
	export class Bone {
	    Name: string;
	    HasScale: boolean;
	    ParentIndex: number;
	    Position: Vector3;
	    Rotation: Quaternion;
	    Scale?: Vector3;
	
	    static createFrom(source: any = {}) {
	        return new Bone(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.HasScale = source["HasScale"];
	        this.ParentIndex = source["ParentIndex"];
	        this.Position = this.convertValues(source["Position"], Vector3);
	        this.Rotation = this.convertValues(source["Rotation"], Quaternion);
	        this.Scale = this.convertValues(source["Scale"], Vector3);
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
	export class BoneWeight {
	    BoneIndex0: number;
	    BoneIndex1: number;
	    BoneIndex2: number;
	    BoneIndex3: number;
	    Weight0: number;
	    Weight1: number;
	    Weight2: number;
	    Weight3: number;
	
	    static createFrom(source: any = {}) {
	        return new BoneWeight(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.BoneIndex0 = source["BoneIndex0"];
	        this.BoneIndex1 = source["BoneIndex1"];
	        this.BoneIndex2 = source["BoneIndex2"];
	        this.BoneIndex3 = source["BoneIndex3"];
	        this.Weight0 = source["Weight0"];
	        this.Weight1 = source["Weight1"];
	        this.Weight2 = source["Weight2"];
	        this.Weight3 = source["Weight3"];
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
	export class TexRect {
	    X: number;
	    Y: number;
	    W: number;
	    H: number;
	
	    static createFrom(source: any = {}) {
	        return new TexRect(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.X = source["X"];
	        this.Y = source["Y"];
	        this.W = source["W"];
	        this.H = source["H"];
	    }
	}
	export class CovertTexToImageResult {
	    Base64EncodedImageData: string;
	    Format: string;
	    Rects: TexRect[];
	
	    static createFrom(source: any = {}) {
	        return new CovertTexToImageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Base64EncodedImageData = source["Base64EncodedImageData"];
	        this.Format = source["Format"];
	        this.Rects = this.convertValues(source["Rects"], TexRect);
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
	export class DynamicBoneColliderBase {
	    TypeName: string;
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
	        this.TypeName = source["TypeName"];
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
	    TypeName: string;
	    Base?: DynamicBoneColliderBase;
	    Radius: number;
	    Height: number;
	
	    static createFrom(source: any = {}) {
	        return new DynamicBoneCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
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
	    TypeName: string;
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
	        this.TypeName = source["TypeName"];
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
	    TypeName: string;
	    Base?: DynamicBoneColliderBase;
	
	    static createFrom(source: any = {}) {
	        return new DynamicBonePlaneCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
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
	    TypeName: string;
	
	    static createFrom(source: any = {}) {
	        return new MissingCollider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TypeName = source["TypeName"];
	    }
	}
	export class ThickDefPerAngle {
	    AngleDegree: number;
	    VertexIndex: number;
	    DefaultDistance: number;
	
	    static createFrom(source: any = {}) {
	        return new ThickDefPerAngle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.AngleDegree = source["AngleDegree"];
	        this.VertexIndex = source["VertexIndex"];
	        this.DefaultDistance = source["DefaultDistance"];
	    }
	}
	export class ThickPoint {
	    TargetBoneName: string;
	    RatioSegmentStartToEnd: number;
	    DistanceParAngle: ThickDefPerAngle[];
	
	    static createFrom(source: any = {}) {
	        return new ThickPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TargetBoneName = source["TargetBoneName"];
	        this.RatioSegmentStartToEnd = source["RatioSegmentStartToEnd"];
	        this.DistanceParAngle = this.convertValues(source["DistanceParAngle"], ThickDefPerAngle);
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
	export class ThickGroup {
	    GroupName: string;
	    StartBoneName: string;
	    EndBoneName: string;
	    StepAngleDegree: number;
	    Points: ThickPoint[];
	
	    static createFrom(source: any = {}) {
	        return new ThickGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.GroupName = source["GroupName"];
	        this.StartBoneName = source["StartBoneName"];
	        this.EndBoneName = source["EndBoneName"];
	        this.StepAngleDegree = source["StepAngleDegree"];
	        this.Points = this.convertValues(source["Points"], ThickPoint);
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
	export class SkinThickness {
	    Use: boolean;
	    Groups: Record<string, ThickGroup>;
	
	    static createFrom(source: any = {}) {
	        return new SkinThickness(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Use = source["Use"];
	        this.Groups = this.convertValues(source["Groups"], ThickGroup, true);
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
	export class MorphData {
	    Name: string;
	    Indices: number[];
	    Vertex: Vector3[];
	    Normals: Vector3[];
	
	    static createFrom(source: any = {}) {
	        return new MorphData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Indices = source["Indices"];
	        this.Vertex = this.convertValues(source["Vertex"], Vector3);
	        this.Normals = this.convertValues(source["Normals"], Vector3);
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
	export class Vector2 {
	    X: number;
	    Y: number;
	
	    static createFrom(source: any = {}) {
	        return new Vector2(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.X = source["X"];
	        this.Y = source["Y"];
	    }
	}
	export class Vertex {
	    Position: Vector3;
	    Normal: Vector3;
	    UV: Vector2;
	
	    static createFrom(source: any = {}) {
	        return new Vertex(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Position = this.convertValues(source["Position"], Vector3);
	        this.Normal = this.convertValues(source["Normal"], Vector3);
	        this.UV = this.convertValues(source["UV"], Vector2);
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
	export class Model {
	    Signature: string;
	    Version: number;
	    Name: string;
	    RootBoneName: string;
	    Bones: Bone[];
	    VertCount: number;
	    SubMeshCount: number;
	    BoneCount: number;
	    BoneNames: string[];
	    BindPoses: number[][];
	    Vertices: Vertex[];
	    Tangents?: Quaternion[];
	    BoneWeights: BoneWeight[];
	    SubMeshes: number[][];
	    Materials: Material[];
	    MorphData?: MorphData[];
	    SkinThickness?: SkinThickness;
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.Name = source["Name"];
	        this.RootBoneName = source["RootBoneName"];
	        this.Bones = this.convertValues(source["Bones"], Bone);
	        this.VertCount = source["VertCount"];
	        this.SubMeshCount = source["SubMeshCount"];
	        this.BoneCount = source["BoneCount"];
	        this.BoneNames = source["BoneNames"];
	        this.BindPoses = source["BindPoses"];
	        this.Vertices = this.convertValues(source["Vertices"], Vertex);
	        this.Tangents = this.convertValues(source["Tangents"], Quaternion);
	        this.BoneWeights = this.convertValues(source["BoneWeights"], BoneWeight);
	        this.SubMeshes = source["SubMeshes"];
	        this.Materials = this.convertValues(source["Materials"], Material);
	        this.MorphData = this.convertValues(source["MorphData"], MorphData);
	        this.SkinThickness = this.convertValues(source["SkinThickness"], SkinThickness);
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
	export class PanierRadiusGroup {
	    BoneName: string;
	    Radius: number;
	    Curve: AnimationCurve;
	
	    static createFrom(source: any = {}) {
	        return new PanierRadiusGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.BoneName = source["BoneName"];
	        this.Radius = source["Radius"];
	        this.Curve = this.convertValues(source["Curve"], AnimationCurve);
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
	
	export class Psk {
	    Signature: string;
	    Version: number;
	    PanierRadius: number;
	    PanierRadiusDistrib: AnimationCurve;
	    PanierRadiusDistribGroups: PanierRadiusGroup[];
	    PanierForce: number;
	    PanierForceDistrib: AnimationCurve;
	    PanierStressForce: number;
	    StressDegreeMin: number;
	    StressDegreeMax: number;
	    StressMinScale: number;
	    ScaleEaseSpeed: number;
	    PanierForceDistanceThreshold: number;
	    CalcTime: number;
	    VelocityForceRate: number;
	    VelocityForceRateDistrib: AnimationCurve;
	    Gravity: Vector3;
	    GravityDistrib: AnimationCurve;
	    HardValues: number[];
	
	    static createFrom(source: any = {}) {
	        return new Psk(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.PanierRadius = source["PanierRadius"];
	        this.PanierRadiusDistrib = this.convertValues(source["PanierRadiusDistrib"], AnimationCurve);
	        this.PanierRadiusDistribGroups = this.convertValues(source["PanierRadiusDistribGroups"], PanierRadiusGroup);
	        this.PanierForce = source["PanierForce"];
	        this.PanierForceDistrib = this.convertValues(source["PanierForceDistrib"], AnimationCurve);
	        this.PanierStressForce = source["PanierStressForce"];
	        this.StressDegreeMin = source["StressDegreeMin"];
	        this.StressDegreeMax = source["StressDegreeMax"];
	        this.StressMinScale = source["StressMinScale"];
	        this.ScaleEaseSpeed = source["ScaleEaseSpeed"];
	        this.PanierForceDistanceThreshold = source["PanierForceDistanceThreshold"];
	        this.CalcTime = source["CalcTime"];
	        this.VelocityForceRate = source["VelocityForceRate"];
	        this.VelocityForceRateDistrib = this.convertValues(source["VelocityForceRateDistrib"], AnimationCurve);
	        this.Gravity = this.convertValues(source["Gravity"], Vector3);
	        this.GravityDistrib = this.convertValues(source["GravityDistrib"], AnimationCurve);
	        this.HardValues = source["HardValues"];
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
	
	export class Tex {
	    Signature: string;
	    Version: number;
	    TextureName: string;
	    Rects: TexRect[];
	    Width: number;
	    Height: number;
	    TextureFormat: number;
	    Data: number[];
	
	    static createFrom(source: any = {}) {
	        return new Tex(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Signature = source["Signature"];
	        this.Version = source["Version"];
	        this.TextureName = source["TextureName"];
	        this.Rects = this.convertValues(source["Rects"], TexRect);
	        this.Width = source["Width"];
	        this.Height = source["Height"];
	        this.TextureFormat = source["TextureFormat"];
	        this.Data = source["Data"];
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

