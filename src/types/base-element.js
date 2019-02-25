/**
 * https://stackoverflow.com/questions/48498581/textcontent-empty-in-connectedcallback-of-a-custom-htmlelement
 */

export class RXBaseElement extends HTMLElement {
    constructor() {
      const self = super()
      self.parsed = false // guard to make it easy to do certain stuff only once
      self.parentNodes = []
      return self
    }
  
    async setup() {
        // collect the parentNodes
        let el = this;
        while (el.parentNode) {
            el = el.parentNode
            this.parentNodes.push(el)
        }
        // check if the parser has already passed the end tag of the component
        // in which case this element, or one of its parents, should have a nextSibling
        // if not (no whitespace at all between tags and no nextElementSiblings either)
        // resort to DOMContentLoaded or load having triggered
        if ([this, ...this.parentNodes].some(el=> el.nextSibling) || document.readyState !== 'loading') {
            await this.childrenAvailableCallback();
        } else {
            this.baseMutationObserver = new MutationObserver(async() => {
                if ([this, ...this.parentNodes].some(el=> el.nextSibling) || document.readyState !== 'loading') {
                    await this.childrenAvailableCallback()
                    this.baseMutationObserver.disconnect()
                }
            });
    
            this.baseMutationObserver.observe(this, {childList: true});
        }
    }
}