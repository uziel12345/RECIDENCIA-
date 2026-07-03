import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [,, filePath] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(filePath);
const names = doc.getRoot().listNodes().map(n => n.getName()).filter(Boolean).sort();
console.log(names.join('\n'));
