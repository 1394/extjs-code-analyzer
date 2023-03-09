import { CodeUtils } from './CodeUtils.js';

export class ExtFileMeta {
    #importPath;
    #code;
    #ast;
    definedClasses = [];
    #codeTransform = [];
    existingImports = [];

    isTransformedCode;

    set ast(ast) {
        this.#ast = ast;
    }

    get ast() {
        return this.#ast;
    }

    set code(ast) {
        this.#code = ast;
    }

    get code() {
        return this.#code;
    }

    get codeTransform() {
        return this.#codeTransform;
    }

    constructor(importPath, code, ast) {
        this.#importPath = importPath;
        code && (this.code = code);
        ast && (this.ast = ast);
    }

    getImportPath() {
        return this.#importPath;
    }

    addCodeTransform(items) {
        if (!items || !items.length) return;
        this.#codeTransform = this.#codeTransform.concat(Array.isArray(items) ? items : [items]);
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

    getTransformedCode() {
        let transformedCode = this.code;
        // TODO maybe sort by start?
        this.codeTransform.reverse().forEach(({ node, replacement }) => {
            transformedCode = CodeUtils.replaceCode(transformedCode, node, replacement);
        });
        this.isTransformedCode = transformedCode === this.code;
        return transformedCode;
    }
}
