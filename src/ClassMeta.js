import { ExtClassProps } from './ClassProps.js';

export class ExtClassMeta extends ExtClassProps {
    resolvedImports = {};

    get imports() {
        return [
            this.extend,
            this.override,
            ...this.requires,
            ...this.uses,
            ...this.mixins,
        ].filter(Boolean);
    }

    constructor() {
        super();
        Object.assign(this, ...arguments);
    }
}
