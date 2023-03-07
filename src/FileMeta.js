export class ExtFileMeta {
    #importPath;
    #ast;
    definedClasses = [];
    callParentNodes = [];
    existingImports = [];

    constructor(importPath) {
        this.#importPath = importPath;
    }

    getImportPath() {
        return this.#importPath;
    }

    addCallParentNodes(items) {
        if (!items || !items.length) return;
        this.callParentNodes = this.callParentNodes.concat(Array.isArray(items) ? items : [items]);
    }

    addDefinedClass(item) {
        if (!item) return;
        this.definedClasses.push(item);
    }

    addExistingImport(item) {
        if (!item) return;
        this.existingImports.push(item);
    }

    setAST(ast) {
        this.#ast = ast;
    }

    getAST() {
        return this.#ast;
    }
}
