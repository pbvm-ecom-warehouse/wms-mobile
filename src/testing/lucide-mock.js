const React = require('react');

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, property) {
      if (property in target) return target[property];
      return function IconMock() {
        return React.createElement(React.Fragment);
      };
    },
  },
);
