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
            Array.isArray(items) ? items : [items],
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

    getResolvedImports() {
        const imports = {};
        this.definedClasses.forEach(({ resolvedImports }) => {
            Object.assign(imports, resolvedImports);
        });
        return imports;
    }

    getResolvedImportPaths() {
        const imports = Object.values(this.getResolvedImports()).filter(
            Boolean,
        );
        return imports.length ? imports.map(({ realPath }) => realPath) : [];
    }
}
