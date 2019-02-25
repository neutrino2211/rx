export class Syntax {
    constructor(syntax){
        this.syntax = syntax
        this.parentheses_balance = 0;
    }

    /**
     * 
     * @param {String} code 
     */
    parse(){
        let tmp = "";
        let matches = []
        for(var c of this.syntax){
            if(this.parentheses_balance > 1){
                tmp += c;
            }
            if(this.parentheses_balance == 0 && tmp.length > 0){
                matches.push("(("+tmp+")")
                tmp = ""
            }
            if(c == "("){
                this.parentheses_balance++;
            } else if(c == ")"){
                this.parentheses_balance--;
            }
        }
        return matches;
    }
}