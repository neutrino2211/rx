import { RxView } from "./elements/RxView";
import { Cache } from "./cache";

import * as directives from "./types/directive"
import { RxFor } from "./directives/for";
import { RxIf } from "./directives/if";
import { RxModel } from "./directives/model";
import { RxData } from "./elements/RxData";

window.RxCache = new Cache();
window.RxDirectives = {};

directives.registerDirective("rx-for",RxFor,"pre");
directives.registerDirective("rx-if",RxIf,"pre");
directives.registerDirective("rx-model",RxModel,"post");

customElements.define("rx-data",RxData)
customElements.define("rx-view",RxView)