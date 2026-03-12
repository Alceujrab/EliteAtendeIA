import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Recursively find all .tsx files in Pages directory
function getPageEntries(dir, base = dir) {
    const entries = [];
    for (const file of readdirSync(dir)) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
            entries.push(...getPageEntries(fullPath, base));
        } else if (file.endsWith('.tsx')) {
            entries.push('resources/js/Pages/' + relative(base, fullPath).replace(/\\/g, '/'));
        }
    }
    return entries;
}

const pageEntries = getPageEntries('resources/js/Pages');

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx', ...pageEntries],
            refresh: true,
        }),
        react(),
    ],
});
