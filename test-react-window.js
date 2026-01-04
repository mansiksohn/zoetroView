console.log('--- Main Require ---');
try {
    const main = require('react-window');
    console.log('Keys:', Object.keys(main));
    console.log('FixedSizeList:', main.FixedSizeList);
} catch (e) { console.log(e.message); }

console.log('--- CJS Require ---');
try {
    const cjs = require('react-window/dist/react-window.cjs');
    console.log('Keys:', Object.keys(cjs));
    console.log('FixedSizeList:', cjs.FixedSizeList);
} catch (e) { console.log(e.message); }
