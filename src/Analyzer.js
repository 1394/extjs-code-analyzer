import {parse} from 'acorn';
import {simple} from 'acorn-walk';
import {ExtClassMeta} from './ClassMeta.js';
import {ExtFileMeta} from './FileMeta.js';
import {CodeUtils} from "./CodeUtils.js";
import {ClassManager} from "./ClassManager.js";

export class ExtAnalyzer {
    static fileMap = {};
    static classes = ClassManager;

    static analyze(code = '', importPath) {
        const ast = parse(code, {ecmaVersion: 2020});
        const fileMeta = new ExtFileMeta(importPath);
        fileMeta.setAST(ast);
        this.fileMap[importPath] = fileMeta;
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
                        const classMeta = new ExtClassMeta({name, importPath});
                        ClassManager.classMap[name] = classMeta;
                        const props = node.expression.arguments[1].properties;
                        props?.forEach(prop => {
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
                                fileMeta.addCallParentNodes(CodeUtils.findCallParent(node, prop.value.value, prop.key.name));
                            }
                            // uses, requires, mixins
                            if (['uses', 'requires', 'mixins'].includes(prop.key.name)) {
                                // TODO mixins can be object
                                classMeta[prop.key.name] = CodeUtils.propToArray(prop.value);
                            }
                        });
                        fileMeta.addDefinedClass(classMeta);
                        if (classMeta.alternateNames.length) {
                            classMeta.alternateNames.forEach(name => {
                                ClassManager.classMap[name] = classMeta;
                            });
                        }
                        if (classMeta.xtype) {
                            ClassManager.xTypeMap[classMeta.xtype] = classMeta;
                        }
                        if (classMeta.alias) {
                            ClassManager.aliasMap[classMeta.alias] = classMeta;
                        }
                        ClassManager.resolveImports(classMeta);
                    }
                }
            }
        });
        return ast;
    }
}
