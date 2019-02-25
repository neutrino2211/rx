export class Events {
    constructor(view){
        this.events = new Map();
        this.view = view;
        view.on = this.on;
        view.emit = this.emit;
    }

    on(name, callback){
        this.events.set(name,callback);
    }

    emit(name, ...args){
        if(this.events.has(name)){
            this.events.get(name).call(this.view,...args);
        }
    }
}