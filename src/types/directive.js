import { Syntax } from "../parsers/syntax";

/**
 * RxDirective is the base class for all rx directives and provides some utility functions for managing data
 */
export class RxDirective {
    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element){
        this.name = ""
        this.element = element;
    }

    useData(data){
        this.data = data;
    }

    parseSyntax(code, data){
        var data = data||this.data;
        var attrs = Object.getOwnPropertyNames(data), attrVars = attrs.map((v)=>data[v]);
        attrs.forEach((a,i)=>{
            var regexp = "{{"+a+"}}";
            code = code.replace(new RegExp(regexp.replace("$","\\$"),"g"),attrVars[i])
        });
        const instances = new Syntax(code).parse();
        instances.forEach((v)=>{
            var js = v.slice(2,-2)
            try {
                const f = new Function(...attrs,"return ("+js+");")
                const r = f.call(this.element,...attrVars);
                code = code.replace(v,r)
            } catch (e) {
                console.warn(
                    "Could not evaluate inline expression '"
                    +js.trim()+"' for '"+this.name+"'\n"+e
                )
            }
        });
        console.RawLog(code)
        return code;
    }

    requiresData(type){
        if(this.data){
            if(type && typeof this.data == type){
                return
            } else {
                console.warn(`Warn: '${this.name}' directive uses component data but did not specify of which type. This may cause weird behavior`)
            }
        }

        throw new Error(`'${this.name}' directive requires data`);
    }
}

export function registerDirective(name,directive,loadTime){
    window.RxDirectives[name] = directive;
    window.RxDirectives[name].loadTime = loadTime;
}

export function directive(name){
    return window.RxDirectives[name]
}

export function directiveExists(name){
    return window.RxDirectives[name]?true:false;
}

export function getDirectives(){
    return Object.getOwnPropertyNames(window.RxDirectives);
}