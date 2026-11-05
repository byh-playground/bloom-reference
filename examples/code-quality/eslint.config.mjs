import js from '@eslint/js';
import globals from 'globals';
import html from 'eslint-plugin-html';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/vendor/**',
            '**/third_party/**',
            '**/*.min.js',
            '**/*.generated.js',
            '**/*.gen.js',
            '**/assets/atlases/**',
            '**/assets/generated/**',
        ],
    },
    {
        files: ['**/*.{js,mjs}', '**/*.{html,htm}'],
        rules: js.configs.recommended.rules,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
        },
    },
    {
        files: ['**/*.{html,htm}'],
        plugins: { html },
    },
    {
        files: ['eslint.config.mjs', 'tools/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}'],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ['**/*.cjs'],
        rules: js.configs.recommended.rules,
        languageOptions: {
            sourceType: 'commonjs',
            globals: globals.node,
        },
    },
];
