console.RawLog = function(){
    if(window.RxDebug){
        console.log(...arguments);
    }
}
import { CSSParser } from "../parsers/css";
import * as dir from "../types/directive";
import { Events } from "../events";
import { Syntax } from "../parsers/syntax";
import SandBox from "../sandbox";
import { RXBaseElement } from "../types/base-element";

function parseHTML(code){
    let html = document.createElement("html");
    html.innerHTML = code;
    return html.getElementsByTagName("body")[0];
}

/**
 * The RxView class is responsible for rendering each template in place. It uses its attributes as a data source
 * for the component it renders and each time its attributes change, it triggers a new render cycle that uses the new attributes
 * as its data.
 */

export class RxView extends RXBaseElement {
    constructor(){
        var self = super();
        this.events = new Events(this);
        this.content = this.innerHTML
        this.isBuildingView  = false;
        this.isObserving = false;
        this.passes = 0;
        return self;
    }

    /**
     * @method observe
     * 
     * This method listens to all changes to the view's attributes and triggers a new render ccle when there is a change
     */
    observe(){
        this.observer = new MutationObserver((mutations)=>{
            for(var mutation of mutations){
                if(mutation.type == "attributes"){
                    console.log("ATTR MUT")
                    this.buildView(this.getAttribute("component")).then((view)=>{
                        this.render(view);
                    })
                }
            }
        })
        
        this.observer.observe(this,{
            attributes: true,
            childList: false,
            subtree: false
        });
        this.isObserving = true;
    }

    /**
     * @method getData
     * 
     * This method converts the view's attributes into an object that can easily be passed around in other functions
     */
    getData(){
        var data = {};
        Array.from(this.attributes).forEach((a)=>{
            if(a.name.startsWith(":")){
                const sandbox = new SandBox(a.value,this);
                sandbox.on("error",function(e,c){
                    data[a.name.slice(1)] = a.value;
                })
                sandbox.on("result",r=>{
                    data[a.name.slice(1)] = r;
                })
                sandbox.execute([],[]);
            }
        })
        return data;
    }

    /**
     * @method setData
     * @param {any} data 
     * 
     * This method sets the view's atributes from the given data
     */
    setData(data){
        if(typeof data !== "object"){
            console.error("Expected object as component data but got "+typeof data);
            return
        }

        if(Array.isArray(data)){
            this.setAttribute(":rxdata", JSON.stringify(data));
        } else {
            Object.getOwnPropertyNames(data).forEach((v)=>{
                var value = data[v];
                if(Array.isArray(value)){
                    value = "["+value.toString()+"]"
                } else if(typeof value == "object"){
                    value = JSON.stringify(value);
                }
                this.setAttribute(":"+v,value);
            })
        }
    }

    /**
     * @method applyPreRenderDirectives
     * @param {HTMLElement} view 
     * 
     * This method is responsible for running all pre-render directives on the elements that need them
     */
    async applyPreRenderDirectives(view,data){
        dir.getDirectives().forEach(async (d)=>{
            var directive = dir.directive(d)
            if(directive.loadTime == "pre"){
                view.querySelectorAll("["+d+"]").forEach(async (e)=>{
                    const _dir = new directive(e);
                    await _dir.parse(data,this);
                })
            }
        })
    }

    /**
     * @method applyPostRenderDirectives
     * @param {HTMLElement} view 
     * 
     * This method is responsible for running all post-render directives on the elements that need them
     */
    async applyPostRenderDirectives(view,data){
        dir.getDirectives().forEach(async (d)=>{
            var directive = dir.directive(d)
            if(directive.loadTime == "post"){
                view.querySelectorAll("["+d+"]").forEach(async (e)=>{
                    const _dir = new directive(e);
                    await _dir.parse(data,this);
                })
            }
        })
    }

    /**
     * @method buildView
     * @param {String} element 
     * 
     * This method fetches the necessary template from either the server or local cache.
     * It is also responsible for applying pre-render directives
     */
    async buildView(element){
        var html = "";
        if(!this.isObserving){
            this.observe()
        }
        console.RawLog(window.RxCache.state)
        if(!window.RxCache.exists(element)){
            this.isBuildingView = true;
            const r = await fetch(element);
            html = await r.text()
            window.RxCache.set(element,html)
            html = window.RxCache.get(element)
            this.isBuildingView = false;
        } else {
            html = window.RxCache.get(element);
            console.RawLog("From cache")
        }
        let ihtml = parseHTML(html).innerHTML;
        const div = document.createElement("body");
        div.innerHTML = ihtml;
        await this.applyPreRenderDirectives(div,this.getData());
        const slot = div.getElementsByTagName("slot")[0];
        slot && slot.replaceWith(...parseHTML(this.content).children);
        return div
    }

    /**
     * @method disconnectedCallback
     * 
     * This method is called before the view is destroyed, so it is responsible for taking down the listeners
     */
    async disconnectedCallback(){
        this.observer.disconnect();
        this.baseMutationObserver.disconnect();
    }

    /**
     * @method connectedCallback
     * 
     * This method sets up the RXBaseElement listeners responsible for calling childrenAvailableCallback
     */
    async connectedCallback(){
        await super.setup()
    }

    /**
     * @method childrenAvailableCallback
     * 
     * This method is responsible for the initial render and chooses the appropriate data source to use for it
     */
    async childrenAvailableCallback(){
        var renderInit = true;
        for(let i=0;i<this.children.length;i++){
            if(this.children[i].tagName.toLowerCase() == "rx-data"){
                renderInit = false;
                break
            }
        }
        if(renderInit){
            this.buildView(this.getAttribute("component")).then(view=>{
                this.render(view);
            })
        } else {
            this.events.on("rx-data",()=>{
                this.buildView(this.getAttribute("component")).then(view=>{
                    this.render(view);
                })
            })
        }
        this.events.emit("render",this);
        this.parsed = true
    }


    /**
     * @method render
     * @param {HTMLElement} view 
     * 
     * This method takes the view built by the buildView method and
     *      1. Evaluates static and dynamic templates
     *      2. Applies styles
     *      3. Execute template scripts
     */
    async render(view){

        /**
         * Replace static data templates with their values
         */
        Array.from(this.attributes).forEach((a)=>{
            if(a.name.startsWith(":")){
                var regexp = "{{"+a.name.slice(1)+"}}"
                view.innerHTML = view.innerHTML.replace(new RegExp(regexp,"g"),a.value)
            }else if(a.name.startsWith("@")){
                var evt = a.name.slice(1);
                var templates = this.getElementsByTagName("template");
                if(templates.length == 0){
                    this.addEventListener(evt,(e)=>{
                        var l = new Function("$event",a.value);
                        l.call(this,e);
                    })
                } else {
                    templates[0].addEventListener(evt,(e)=>{
                        var l = new Function("$event",a.value);
                        l.call(this,e);
                    })
                }
            }
        });

        /**
         * Apply styles to the appropriate elements.
         * NB: Not efficient, need another method
         */
        Array.from(view.querySelectorAll("style")).forEach(el=>{
            const parser = new CSSParser(el.textContent)
            const rules = parser.parse()
            rules.forEach((v,k)=>{
                view.querySelectorAll(k).forEach((e)=>{
                    let rulesObj = CSSParser.prototype.transformRules.call(this,v);
                    Object.getOwnPropertyNames(rulesObj).forEach((r)=>{
                        e.style[r] = rulesObj[r];
                    })
                })
            })
        })

        //Get a scriptless copy of the proposed view because we only want to parse templates outside script element
        var scriptlessView = view.cloneNode(true)
        Array.from(scriptlessView.getElementsByTagName("script")).forEach(e=>{
            e.remove()
        })

        /**
         * Evaluaye all instances of executable templates inside the view
         */
        const instances = new Syntax(scriptlessView.innerHTML).parse()
        instances.forEach((v)=>{
            var js = v.slice(2,-2)
            try {
                var d = this.getData()
                var dn = Object.getOwnPropertyNames(d);
                const f = new Function(...dn,"return ("+js+")")
                var vars = dn.map(v=>d[v]);
                // console.log(vars)
                const r = f.call(this,...vars);
                view.innerHTML = view.innerHTML.replace(v,r)
            } catch (e) {
                console.warn(
                    "Could not evaluate inline expression '"
                    +js.trim()+"' for '"+this.getAttribute("component")+"'\n"+e
                )
            }
        });

        /**
         * Remove all stylesheets because we just parsed them
         */
        Array.from(view.querySelectorAll("style")).forEach((e)=>{
            e.remove();
        })


        /**
         * If we are rendering this view for the first time then we just set our current innerHTML to what was rendered and
         * provide our scripts with utility functions before callong them
         * 
         * Else we check through each element proposed by the new render cycle and replace those that have changed
         */
        if(this.passes == 0){
            this.innerHTML = view.innerHTML;

            //Perform all post-render operations 
            await this.applyPostRenderDirectives(this,this.getData());

            //Run each script
            Array.from(view.querySelectorAll("script")).forEach(el=>{
                const script = new Function("updateData",el.textContent);
                script.call(this,(data)=>{
                    if(typeof data !== "object"){
                        console.error("Expected object or array as component data but got "+typeof data);
                        return
                    }

                    if(Array.isArray(data)){
                        this.setAttribute(":rxdata", JSON.stringify(data));
                    } else {
                        Object.getOwnPropertyNames(data).forEach((v)=>{
                            var value = data[v];
                            if(Array.isArray(value)){
                                value = "["+value.toString()+"]"
                            } else if(typeof value == "object"){
                                value = JSON.stringify(value);
                            }
                            this.setAttribute(":"+v,value);
                        })
                    }
                })
            })
        } else {
            var proposedChidren = view.children;
            var currentChildren = this.children;
            for(let i=0; i<proposedChidren.length; i++){
                const p = proposedChidren[i];
                for(let j=0; j<currentChildren.length; j++){
                    const c = currentChildren[j];
                    if(p.getAttribute("data-rx-uuid") == c.getAttribute("data-rx-uuid") && p.innerHTML !== c.innerHTML){
                        c.replaceWith(p)
                        /*
                        Reduce counter because by replacing one of the elements in the collection, the reference to it has been lost
                        and the collection has one less element
                        */
                        i--;
                        break;
                    }
                }
            }
        }

        //A render cycle has been completed so increase the passes counter
        this.passes++;
    }
}