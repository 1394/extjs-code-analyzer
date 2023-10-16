import { CodeUtils } from './CodeUtils.js';

export class ExtFileMeta {
    #importPath;
    #code;
    #transformedCode;
    #ast;
    definedClasses = [];
    #codeTransforms = [];
    existingImports = [];
    isCached = false;
    appliedTransformations = 0;

    set ast(ast) {
        this.#ast = ast;
    }

    get ast() {
        return this.#ast;
    }

    set code(code) {
        this.#code = code;
    }

    get code() {
        return this.#code;
    }

    set transformedCode(code) {
        this.#transformedCode = code;
    }

    get transformedCode() {
        return this.#transformedCode;
    }

    get codeTransforms() {
        return this.#codeTransforms;
    }

    constructor(importPath, code, ast) {
        this.#importPath = importPath;
        code && (this.code = code);
        ast && (this.ast = ast);
    }

    get importPath() {
        return this.#importPath;
    }

    addCodeTransform(items = []) {
        if (!items.length) return;
        this.#codeTransforms = this.#codeTransforms.concat(items);
    }

    addDefinedClass(item) {
        if (!item) return;
        this.definedClasses.push(item);
    }

    addExistingImport(item) {
        if (!item) return;
        this.existingImports.push(item);
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

    getMissingImports(ignoredNamespaces = []) {
        const imports = {};
        this.definedClasses.map(({ name, importsMeta }) => {
            imports[name] = Object.keys(importsMeta).filter((className) => {
                const ns = className.split('.').shift();
                return !ignoredNamespaces.length || (!ignoredNamespaces.includes(ns) && !importsMeta[className]);
            });
        });
        return imports;
    }

    applyCodeTransforms() {
        this.#codeTransforms.reverse().forEach(({ node, replacement }) => {
            this.#transformedCode = CodeUtils.replaceCode(this.#transformedCode || this.#code, node, replacement);
        });
        this.appliedTransformations = this.#codeTransforms.length;
        this.appliedTransformations && (this.#codeTransforms = []);
        return this.#transformedCode || this.#code;
    }

    getClassNames() {
        return this.definedClasses.map(({ name }) => name);
    }
}
