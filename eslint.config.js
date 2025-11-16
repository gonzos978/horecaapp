import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            // allow @ts-ignore
            '@typescript-eslint/ban-ts-comment': [
                'warn', // or 'off' if you want no warnings
                {
                    'ts-expect-error': 'allow-with-description', // optional: enforce description
                    'ts-ignore': 'allow-with-description',       // allow ts-ignore
                    'ts-nocheck': 'allow',
                    'ts-check': 'allow'
                }
            ]
        }
    },
])
