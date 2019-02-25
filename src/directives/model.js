import { RxDirective } from "../types/directive";

export class RxModel extends RxDirective {
    /**
     * 
     * @param {HTMLInputElement} element 
     */
    constructor(element){
        super(element)
        this.element = element;
        this.name = "rx-model"
        this.postRender = true
    }

    async parse(data, parent){
        const varName = this.element.getAttribute("rx-model");
        const value = data[varName]

        if(value == undefined){
            console.error(`Error: could not find variable '${varName}'`);
            return;
        }
        if(this.element.tagName.toLowerCase() !== "input"){
            console.error("Error: rx-model used on a non-input element");
            return;
        }

        this.element.value = value;
        const observer = new MutationObserver((r)=>{
            for(var mut of r){
                if(mut.type == "attributes" && parent.getAttribute(":"+varName) !== this.element.value){
                    this.element.value = parent.getAttribute(":"+varName);
                }
            }
        })

        observer.observe(parent,{
            attributes: true
        })
        // console.log(this.element)
        // console.log(value)
        this.element.addEventListener("keyup",(ev)=>{
            // console.log(this.element.value)
            parent.setAttribute(":"+varName,this.element.value);
        })
    }
}