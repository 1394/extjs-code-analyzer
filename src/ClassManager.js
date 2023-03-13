export class ClassManager {
    static classMap = {};
    static xTypeMap = {};
    static aliasMap = {};

    static resolveViewModelAndController(classMeta) {
        for (let type of ['controller', 'viewModel']) {
            const name = classMeta[type];
            if (typeof name === 'string') {
                const resolvedClassMeta = this.classMap[name] || this.aliasMap[`${type.toLowerCase()}.${name}`];
                if (resolvedClassMeta) {
                    classMeta.addImportMeta(resolvedClassMeta.name, resolvedClassMeta);
                }
            }
        }
    }

    static resolveImports(name) {
        const classes = name ? { [name]: this.classMap[name] } : this.classMap;
        for (const className in classes) {
            const classMeta = classes[className];
            if (classMeta.imports.length) {
                classMeta.imports.forEach((importName) => {
                    if (importName.endsWith('.*')) {
                        for (const className in this.classMap) {
                            if (className === classMeta.name) continue;
                            if (className.startsWith(importName.slice(0, -2))) {
                                classMeta.addImportMeta(className, this.classMap[className]);
                            }
                        }
                    } else {
                        classMeta.addImportMeta(importName, this.classMap[importName]);
                    }
                });
            }
            this.resolveViewModelAndController(classMeta);
        }
    }

    static classMapToJSON() {
        const json = {};
        for (const className in this.classMap) {
            json[className] = this.classMap[className]['realPath'];
        }
        return JSON.stringify(json);
    }
}
