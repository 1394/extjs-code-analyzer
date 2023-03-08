export class ExtFileMeta {
    #importPath;
    #ast;
    definedClasses = [];
    codeTransform = [];
    existingImports = [];

    constructor(importPath) {
        this.#importPath = importPath;
    }

    getImportPath() {
        return this.#importPath;
    }

    addCodeTransform(items) {
        if (!items || !items.length) return;
        this.codeTransform = this.codeTransform.concat(Array.isArray(items) ? items : [items]);
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
