export class ClassManager {
    static classMap = {};
    static xTypeMap = {};
    static aliasMap = {};

    static resolveImports(name) {
        const classes = name ? {[name]: this.classMap[name]} : this.classMap;
        for (const className in classes) {
            const classMeta = classes[className];
            if (classMeta.imports.length) {
                classMeta.imports.forEach(importName => {
                    classMeta.resolvedImports[importName] = this.classMap[importName];
                });
            }
        }
    }
}
