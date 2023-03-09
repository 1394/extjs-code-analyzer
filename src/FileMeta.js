export class ExtFileMeta {
    #importPath;
    #ast;
    definedClasses = [];
    #codeTransform = [];
    existingImports = [];

    get codeTransform() {
        return this.#codeTransform;
    }

    constructor(importPath) {
        this.#importPath = importPath;
    }

    getImportPath() {
        return this.#importPath;
    }

    addCodeTransform(items) {
        if (!items || !items.length) return;
        this.#codeTransform = this.#codeTransform.concat(
            Array.isArray(items) ? items : [items]
        );
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

    getImportsMeta() {
        const imports = {};
        this.definedClasses.forEach(({ importsMeta }) => {
            Object.assign(imports, importsMeta);
        });
        return imports;
    }

    getImportsPaths() {
        const imports = Object.values(this.getImportsMeta()).filter(Boolean);
        return imports.length ? imports.map(({ realPath }) => realPath) : [];
    }
}
