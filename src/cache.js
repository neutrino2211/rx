function parseHTML(code){
    let html = document.createElement("html");
    html.innerHTML = code;
    return html.getElementsByTagName("body")[0];
}

//Generate random hash-like string
function generateUUID(){
    var hex_codes = ["0","1","2","3","4","5","6","7","8","9","a","b","c","e","f"]
    var str = ""
    for(let i=1;i<=32;i++){
        str += hex_codes[(Math.floor(Math.random()*0xf))]
        if(i%4 == 0){
            str += "-"
        }
    }
    return str;
}

/**
 * The Cache class provides an interface for storing and retrieving components.
 */
export class Cache {
    constructor(){
        this.cache = {};
    }

    exists(name){
        return this.cache[name] != undefined;
    }

    set(name, v){
        const doc = parseHTML(v)
        Array.from(doc.querySelectorAll("*")).forEach((v)=>{
            v.setAttribute("data-rx-uuid",generateUUID())
        })
        this.cache[name] = doc.innerHTML;
    }

    get(name){
        return this.cache[name]
    }

    get state(){
        return this.cache;
    }
}