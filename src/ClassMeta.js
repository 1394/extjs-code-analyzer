import { ExtClassProps } from './ClassProps.js';

export class ExtClassMeta extends ExtClassProps {
    importsMeta = {};

    get imports() {
        return [
            this.extend, //TODO test exclude
            this.override, //TODO test exclude
            ...this.requires,
            ...this.uses,
            ...this.mixins,
        ].filter(Boolean);
    }

    constructor() {
        super();
        Object.assign(this, ...arguments);
    }

    addImportMeta(name, classMeta) {
        this.importsMeta[name] = classMeta;
    }
}
