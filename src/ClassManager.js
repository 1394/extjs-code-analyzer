export class ClassManager {
    static classMap = {};
    static xTypeMap = {};
    static aliasMap = {};
    static aliasTypes = [{ type: 'controller' }, { type: 'viewModel' }, { type: 'stores', prefix: 'store' }];

    static resolveAliases(classMeta) {
        for (let cfg of this.aliasTypes) {
            const values = Array.isArray(classMeta[cfg.type]) ? classMeta[cfg.type] : [classMeta[cfg.type]];
            for (const value of values) {
                if (typeof value === 'string') {
                    const found =
                        this.classMap[value] || this.aliasMap[`${(cfg.prefix || cfg.type).toLowerCase()}.${value}`];
                    if (found) {
                        this.classMap[found.name] = found;
                    }
                    classMeta.addImportMeta(found?.name || value, found);
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
            this.resolveAliases(classMeta);
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
