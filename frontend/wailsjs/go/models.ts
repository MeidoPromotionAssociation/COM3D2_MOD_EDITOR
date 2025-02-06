export namespace COM3D2 {
	
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

}

