import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { ExtClassMeta } from './ClassMeta.js';
import { ExtFileMeta } from './FileMeta.js';
import { CodeUtils } from './CodeUtils.js';
import { ClassManager } from './ClassManager.js';

// TODO get parser from plugin
export class ExtAnalyzer {
    static fileMap = {};
    static classManager = ClassManager;
    static parserOptions = {
        ecmaVersion: 'latest',
        sourceType: 'module',
    };

    static analyze(code = '', realPath, isResolveImports = false) {
        // TODO get options from vite || pass parse fn
        const ast = parse(code, this.parserOptions);
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
                    //TODO add support Ext.Application requires
                    const methodName = node.expression.callee.property.name;
                    if (['define', 'application'].includes(methodName)) {
                        const name = node.expression.arguments[0].value;
                        const classMeta = new ExtClassMeta({
                            name,
                            realPath,
                        });
                        ClassManager.classMap[name] = classMeta;
                        const dataNode = node.expression.arguments[methodName === 'application' ? 0 : 1];
                        const props = dataNode.properties;
                        props?.forEach((prop) => {
                            // alias (can be array)
                            if (['alias'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = CodeUtils.propToArray(prop.value);
                            }
                            // xtype
                            if (['xtype'].includes(prop.key.name)) {
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
                                    CodeUtils.prepareTransforms(dataNode, prop.value.value, prop.key.name)
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
                            ClassManager.xtypeMap[classMeta.xtype] = classMeta;
                        }
                        if (Array.isArray(classMeta.alias)) {
                            classMeta.alias.forEach((alias) => {
                                ClassManager.aliasMap[alias] = classMeta;
                            });
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

    static getClass(className) {
        return this.classManager.classMap[className];
    }

    static sync(code, realPath) {
        const fileMeta = this.getFile(realPath);
        const isEqual = fileMeta && fileMeta.code === code;
        fileMeta && (fileMeta.isCached = isEqual);
        return isEqual ? fileMeta : this.analyze(code, realPath, true);
    }
}
