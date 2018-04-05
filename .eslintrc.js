module.exports = {
    "env": {
        "browser": false,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "plugins": [
      "node",
      "mocha"
    ],
    "ecmaFeatures": { "modules": true },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "jsx": true,
        "ecmaVersion": 2017
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        'no-console': 'off',
        "mocha/no-exclusive-tests": "error"
    }
}
;
