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

    applyCodeTransforms() {
        this.#codeTransforms.reverse().forEach(({ node, replacement }) => {
            this.#transformedCode = CodeUtils.replaceCode(this.#transformedCode || this.#code, node, replacement);
        });
        this.#codeTransforms.length && (this.#codeTransforms = []);
        return this.#transformedCode || this.#code;
    }
}
