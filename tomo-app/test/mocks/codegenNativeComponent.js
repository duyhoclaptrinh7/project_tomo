const React = require('react');

function codegenNativeComponent(name) {
  const Component = React.forwardRef((props, ref) => {
    return React.createElement(name, { ...props, ref });
  });
  Component.displayName = name;
  return Component;
}

codegenNativeComponent.default = codegenNativeComponent;
module.exports = codegenNativeComponent;
