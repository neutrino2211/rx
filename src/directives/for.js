import { RxDirective } from "../types/directive";

export class RxFor extends RxDirective {
    constructor(element){
        super(element);
        this.name = "rx-for"
    }
    /**
     * 
     * @param {Array<any>} arr 
     */
    async sanitize(arr){
        var r = []
        arr.forEach((v)=>{
            if(v){
                r.push(v)
            }
        })
        return r;
    }

    async parse(data){
        data = this.element.scopeData||data
        this.useData(data);
        /*
        I Expect the component to verify the existence of this attribute before loading
        the directive
        */
        var attr = this.element.getAttribute("rx-for")
        var isIn = attr.includes(" in ");
        var isOf = attr.includes(" of ");
        var splitter = isIn ? " in " : " of ";
        if(isOf || isIn){
            const statement = attr.split(splitter)[1].trim()
            const varName = attr.split(splitter)[0].trim()
            const f = new Function(...Object.getOwnPropertyNames(data),"return ("+statement+");");
            var value = [];
            try {
                value = f.call(this.element,...Object.getOwnPropertyNames(data).map((v)=>data[v]))
            } catch (err) {
                throw new Error("error in rx-for statement \n"+err);
            }

            console.RawLog(value);
            if(!Array.isArray(value)){
                value = Array.from(value)
            }
            var replacementElements = []
            var ihtml = this.element.innerHTML;
            value.forEach((v,i)=>{
                var d = Object.assign({},data);
                d[varName] = v;
                d["$index"] = i;
                const eHtml = this.parseSyntax(ihtml,d);
                const e = document.createElement(this.element.tagName);
                e.innerHTML = eHtml;
                Array.from(e.querySelectorAll("[rx-if]")).forEach(el=>{
                    el.scopeData = d
                })
                e.setAttribute("data-rx-uuid",this.element.getAttribute("data-rx-uuid")+i)
                replacementElements.push(e)
            })
            console.RawLog(replacementElements)
            this.element.replaceWith(...replacementElements)
        } else {
            throw new Error("Invalid syntax in rx-for\n\n"+attr)
        }
    }
}