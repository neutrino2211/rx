import { Events } from "./events";

/**
 * The SandBox class provides a safe enclosure for running untrusted code in a defined context
 */
export default class SandBox extends Events {
    constructor(code, ctx){
        super(ctx||{});
        this.ctx = ctx || {};
        this.code = code
        this.result = ""
    }

    execute(args, values){
        try{
            const f = new Function(...args,"return ("+this.code+");");
            this.result = f.call(this.ctx,...values);
            this.emit("result",this.result);
        } catch(e){
            this.emit("error",e,"return ("+this.code+");");
        }
    }
}