export class ClassManager {
    static classMap = {};
    static xTypeMap = {};
    static aliasMap = {};

    static resolveImports(classMeta) {
        const imports = [
            classMeta.extend,
            classMeta.override,
            ...classMeta.requires,
            ...classMeta.uses,
            ...classMeta.mixins
        ].filter(Boolean);
        console.log(imports, classMeta.name);
    }
}
