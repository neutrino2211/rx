
/**
 * The RxData class is a component that initializes a view with external data
 */
export class RxData extends HTMLElement {
    constructor(){
        super();
    }

    async connectedCallback(){
        if(this.parentElement.tagName.toLowerCase() !== "rx-view"){
            throw new Error("rx-data can only be used on an rx-view, not "+this.parentElement.tagName);
        }
        this.parentElement.events.on("render",async e=>{
            const src = this.getAttribute("src");
            const headers = this.getAttribute("headers")||{};
            const method = this.getAttribute("method")||"GET";
            if(src == null){
                throw new Error("rx-data expects an src attribute");
            }
            var rinf = new Request({
                method: method,
                headers: headers,
                url: src
            })
            const r = await fetch(src);
            var json = await r.json()
            e.setData(json);
            e.events.emit("rx-data",json)
            this.remove();
        })
    }
}