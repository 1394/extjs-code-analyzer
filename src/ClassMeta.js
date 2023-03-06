import { ExtClassProps } from "./ClassProps.js";

export class ExtClassMeta extends ExtClassProps {
    callParentNodes = [];

    constructor() {
        super();
        Object.assign(this, ...arguments);
    }

    getImportString() {
        return this.imports.reduce((str, path) => `${str}import '${path}.js';\n`, '');
    }
}