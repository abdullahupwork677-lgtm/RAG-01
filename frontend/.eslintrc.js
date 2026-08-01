"use strict";
module.exports = {
  root: true,
  env: { node: true, browser: true, jest: true },
  extends: ['eslint-config-next'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
  },
};