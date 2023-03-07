console.time('Total');
import {globby} from 'globby';
// import { outputFile } from 'fs-extra/esm';

import {readFile} from 'fs/promises';
import {normalize} from 'path';
import {ExtAnalyzer} from './src/Analyzer.js'

const modules = await globby('node_modules/ru.coon/src/**/*.+(js|scss)');
const cwd = process.cwd();

all:
    for (const path of modules) {
        if (!path.endsWith('.js')) continue;
        const realPath = normalize(`${cwd}/${path}`);
        const source = await readFile(realPath);
        ExtAnalyzer.analyze(source.toString(), path);

        for (const key in ExtAnalyzer.fileMap) {
            if (Object.hasOwnProperty.call(ExtAnalyzer.fileMap, key)) {
                const fileMeta = ExtAnalyzer.fileMap[key];
                if (fileMeta.callParentNodes.length) {
                    console.log(fileMeta.getImportPath());
                    fileMeta.callParentNodes.forEach(node => {
                        console.log(node);
                    });
                    break all;
                }
            }
        }
    }

console.timeEnd('Total');
// await outputFile('./list.txt', packages.join('\n'));
