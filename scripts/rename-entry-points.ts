/// <reference path="../node/node.d.ts" />

import * as fs from 'fs';
import * as path from 'path';

function repeat(s: string, count: number) {
	return Array(count + 1).join(s);
}

function checkDir(home: string, count: number) {
	fs.readdir(home, (err, dirs) => {
		if (err) throw err;

		for (const dir of dirs.map(d => path.join(home, d))) {
			fs.lstat(dir, (err, stats) => {
				if(dir.indexOf('.git') > 0) return;

				if (err) throw err;
				if (stats.isDirectory()) {
					checkDir(dir, count + 1);
					fs.readdir(dir, (err, files) => {
						if (err) throw err;
						const target = path.join(dir, 'tsconfig.json');
						fs.exists(target, exists => {
							if (exists) {
								const old = JSON.parse(fs.readFileSync(target, 'utf-8'));

								let entryPoint: string = undefined;
								let definitionFiles = files.filter(f => (f.indexOf('.d.ts') > 0));
								if (definitionFiles.length === 1) {
									entryPoint = definitionFiles[0];
								} else if(fs.existsSync(path.join(dir, 'index.d.ts'))) {
									entryPoint = 'index.d.ts';
								} else {
									entryPoint = path.basename(dir) + '.d.ts';
								}

								if (!fs.existsSync(path.join(dir, entryPoint))) {
									console.log('No file ' + entryPoint + ' exists in ' + dir + ' so deleting it');
									fs.unlink(target);
									return;
								}

								const testFile = files.filter(f => f.toLowerCase().indexOf('-tests.ts') > 0)[0];
								if (testFile) {
									old['files'] = ['index.d.ts', testFile];
								} else {
									old['files'] = ['index.d.ts'];
								}
								if (entryPoint !== 'index.d.ts') {
									fs.rename(path.join(dir, entryPoint), path.join(dir, 'index.d.ts'));
								}

								fs.writeFileSync(target, JSON.stringify(old, undefined, 4));
								console.log('Write to ' + target);
							}
						});
					});
				}
			});
		}
	});
}

checkDir(path.join(__dirname, '..'), 1);
