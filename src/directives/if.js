import { RxDirective } from "../types/directive";

export class RxIf extends RxDirective {
    constructor(element){
        super(element);
        this.name = "rx-if"
    }

    async parse(data){
        data = this.element.scopeData||data
        this.useData(data);
        /*
        I Expect the component to verify the existence of this attribute before loading
        the directive
        */
        var attr = this.element.getAttribute("rx-if")
        const f = new Function(...Object.getOwnPropertyNames(data),"return ("+attr+");");
        var value = false;
        try {
            value = f.call(this.element,...Object.getOwnPropertyNames(data).map((v)=>data[v]))
        } catch (err) {
            throw new Error("error in rx-if statement \n"+err);
        }

        console.RawLog(value);
        console.RawLog(f.toString())
        console.RawLog(data)
        if(!value){
            this.element.remove()
        }
    }
}