class CSSParser {
    /**
     * 
     * @param {String} css 
     */
    constructor(css){
        this.css = css;
        this.rules = new Map();
        this.currentSelector = "";
        this.currentCSSRules = "";

        this.eval = true;
        this.ruleBlock = 0;
        this.styleTarget = document.createElement('div');
    }
    /**
     * 
     * @param {string} rules 
     */
    transformRules(rules){
        let r = {}
        const kvml = rules.split(";")
        kvml.forEach((kvm)=>{
            if(kvm=="") return;
            let kvma = kvm.split(":")
            let k = kvma[0];
            let v = kvma[1];
            r[k.trim()] = v.trim()
        })
        return r;
    }

    parse(){
        const chars = this.css.split('')
        let tmp = ""
        for(let i = 0; i<chars.length;i++){
            let char = chars[i];
            if(this.eval && char == "{"){
                if(this.ruleBlock == 0){
                    console.RawLog(tmp.trim())
                    this.currentSelector = tmp.trim();
                    tmp = "";
                    this.eval = false
                } else {
                    this.ruleBlock ++;
                }
            } else if(!this.eval && char == "}"){
                if(this.ruleBlock == 0){
                    this.currentCSSRules = tmp.trim()
                    this.rules.set(this.currentSelector,this.currentCSSRules);
                    tmp = "";
                    this.eval = true;
                } else {
                    this.ruleBlock --;
                }
            } else {
                tmp += char;
            }
        }

        return this.rules;
    }
}

exports.CSSParser = CSSParser