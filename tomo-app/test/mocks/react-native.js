const React = require('react');

const createHostComponent = (name) => {
  const Component = React.forwardRef((props, ref) => {
    return React.createElement(name, { ...props, ref });
  });
  Component.displayName = name;
  return Component;
};

const View = createHostComponent('View');
const Text = createHostComponent('Text');
const TextInput = React.forwardRef((props, ref) => {
  return React.createElement('TextInput', {
    ...props,
    ref,
    onChangeText: props.onChangeText,
    value: props.value,
    placeholder: props.placeholder,
  });
});
TextInput.displayName = 'TextInput';

const Pressable = React.forwardRef(({ onPress, children, disabled, accessible, ...props }, ref) => {
  return React.createElement(
    'Pressable',
    {
      accessible: accessible ?? true,
      ...props,
      ref,
      disabled,
      onClick: disabled ? undefined : onPress,
      onPress: disabled ? undefined : onPress,
    },
    typeof children === 'function' ? children({ pressed: false }) : children,
  );
});
Pressable.displayName = 'Pressable';

const KeyboardAvoidingView = createHostComponent('KeyboardAvoidingView');

const FlatList = React.forwardRef(
  ({ data = [], renderItem, keyExtractor, ListEmptyComponent, ...props }, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollToEnd: () => {},
    }));
    if ((!data || data.length === 0) && ListEmptyComponent) {
      const Empty =
        typeof ListEmptyComponent === 'function'
          ? React.createElement(ListEmptyComponent, null)
          : ListEmptyComponent;
      return React.createElement(View, { ref }, Empty);
    }
    return React.createElement(
      View,
      { ref, ...props },
      (data || []).map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return React.createElement(React.Fragment, { key }, renderItem({ item, index }));
      }),
    );
  },
);
FlatList.displayName = 'FlatList';

const StyleSheet = {
  create: (styles) => styles,
  flatten: (styles) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles || {}),
};

const Platform = {
  OS: 'android',
  select: (obj) => obj.android ?? obj.default,
};

const Alert = {
  alert: () => {},
};

const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
};

const ReactNativeMock = {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  AppState,
  default: null,
};
ReactNativeMock.default = ReactNativeMock;

module.exports = ReactNativeMock;
