import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { ExtClassMeta } from './ClassMeta.js';
import { ExtFileMeta } from './FileMeta.js';
import { CodeUtils } from './CodeUtils.js';
import { ClassManager } from './ClassManager.js';

export class ExtAnalyzer {
    static fileMap = {};
    static classManager = ClassManager;

    static analyze(code = '', realPath, isResolveImports = false) {
        // TODO get options from vite || pass parse fn
        const ast = parse(code, { ecmaVersion: 2020 });
        const fileMeta = new ExtFileMeta(realPath, code, ast);
        this.fileMap[realPath] = fileMeta;
        CodeUtils.code = code;
        simple(ast, {
            ImportDeclaration(node) {
                fileMeta.addExistingImport(node.source.value);
            },
            ExpressionStatement: (node) => {
                if (node.expression.callee?.object?.name === 'Ext') {
                    // Ext.define
                    if (node.expression.callee.property.name === 'define') {
                        const name = node.expression.arguments[0].value;
                        const classMeta = new ExtClassMeta({
                            name,
                            realPath,
                        });
                        ClassManager.classMap[name] = classMeta;
                        const props = node.expression.arguments[1].properties;
                        props?.forEach((prop) => {
                            // alias
                            if (['alias', 'xtype'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = prop.value.value;
                            }
                            // alternateClassName
                            if (prop.key.name === 'alternateClassName') {
                                classMeta.alternateNames = CodeUtils.propToArray(prop.value);
                            }
                            // extend, override
                            if (['extend', 'override'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = prop.value.value;
                                fileMeta.addCodeTransform(
                                    CodeUtils.prepareTransforms(node, prop.value.value, prop.key.name)
                                );
                            }
                            // uses, requires, mixins, stores
                            if (['uses', 'requires', 'mixins', 'stores'].includes(prop.key.name)) {
                                // TODO mixins can be object
                                classMeta[prop.key.name] = CodeUtils.propToArray(prop.value);
                            }
                            // controller, viewModel
                            if (['controller', 'viewModel'].includes(prop.key.name)) {
                                if (prop.value.type === 'Literal') {
                                    classMeta[prop.key.name] = prop.value.value;
                                }
                                if (prop.value.type === 'ObjectExpression') {
                                    if (prop.key.name === 'viewModel') {
                                        const vmTypeNode = prop.value.properties.find(
                                            (p) => p.key.type === 'Identifier' && p.key.name === 'type'
                                        );
                                        if (vmTypeNode && vmTypeNode.value.type === 'Literal') {
                                            classMeta[prop.key.name] = vmTypeNode.value.value;
                                        }
                                    }
                                }
                            }
                        });
                        fileMeta.addDefinedClass(classMeta);
                        if (classMeta.alternateNames.length) {
                            classMeta.alternateNames.forEach((name) => {
                                ClassManager.classMap[name] = classMeta;
                            });
                        }
                        if (classMeta.xtype) {
                            ClassManager.xTypeMap[classMeta.xtype] = classMeta;
                        }
                        if (classMeta.alias) {
                            ClassManager.aliasMap[classMeta.alias] = classMeta;
                        }
                    }
                }
            },
        });
        if (isResolveImports) {
            fileMeta.definedClasses.forEach(({ name }) => {
                this.classManager.resolveImports(name);
            });
        }
        return fileMeta;
    }

    static getFile(realPath) {
        return this.fileMap[realPath];
    }

    /* static isSameCode(realPath, code) {
        const fileMeta = this.getFile(realPath);
        return fileMeta && fileMeta.code === code && fileMeta.isCodeTransformApplied && fileMeta.isImportsInjected;
    } */
}
