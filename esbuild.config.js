import { context, build } from 'esbuild';

const args = process.argv.slice(2);

const isWatchMode = args.includes('--watch');

const options = {
    bundle: true,
    entryPoints: ['src/Analyzer.js'],
    outfile: 'dist/Analyzer.js',
    platform: 'node',
    allowOverwrite: true,
    format: 'esm',
};
if (isWatchMode) {
    const ctx = await context(options);
    await ctx.watch();
} else {
    await build(options);
}
console.clear();
console.log('[esbuild] ' + (isWatchMode ? 'Watching...' : 'Build complete.'));
