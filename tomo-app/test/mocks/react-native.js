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
const Image = createHostComponent('Image');
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
      return React.createElement(View, null, Empty);
    }
    return React.createElement(
      View,
      props,
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

const appStateListeners = new Set();
const AppState = {
  currentState: 'active',
  addEventListener: (event, handler) => {
    if (event === 'change') {
      appStateListeners.add(handler);
    }
    return {
      remove: () => {
        appStateListeners.delete(handler);
      },
    };
  },
  _emit: (event, state) => {
    if (event === 'change') {
      AppState.currentState = state;
      appStateListeners.forEach((fn) => fn(state));
    }
  },
};

const ScrollView = createHostComponent('ScrollView');
const ActivityIndicator = createHostComponent('ActivityIndicator');

const Switch = React.forwardRef(({ value, onValueChange, disabled, testID, ...props }, ref) => {
  return React.createElement('input', {
    type: 'checkbox',
    'data-testid': testID,
    testID,
    checked: Boolean(value),
    disabled,
    onChange: (e) => {
      const next = typeof e === 'boolean' ? e : e?.target ? Boolean(e.target.checked) : Boolean(e);
      onValueChange && onValueChange(next);
    },
    onValueChange: (val) => onValueChange && onValueChange(val),
    ref,
    ...props,
  });
});
Switch.displayName = 'Switch';

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent: (comp) => comp,
  Value: class {
    constructor(val) {
      this._val = val;
    }
    setValue(val) {
      this._val = val;
    }
    interpolate() {
      return this;
    }
  },
  timing: () => ({
    start: (cb) => cb && cb({ finished: true }),
  }),
  spring: () => ({
    start: (cb) => cb && cb({ finished: true }),
  }),
};

const NativeModules = {
  TomoNativeModule: {
    isOverlayPermissionGranted: async () => false,
    openOverlaySettings: async () => true,
    startOverlay: async () => true,
    stopOverlay: async () => true,
    openOverlayChat: async () => true,
    setOverlaySpeaking: async () => true,
    setOverlayFocused: async () => true,
    openScheduleIntent: async () => true,
    startFocusSession: async () => true,
    pauseFocusReminders: async () => true,
    endFocusSession: async () => true,
    openBatteryOptimizationSettings: async () => true,
  },
};

const Dimensions = {
  get: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: 1,
  }),
  addEventListener: () => ({ remove: () => {} }),
};

const I18nManager = {
  isRTL: false,
  doLeftAndRightSwapInRTL: false,
  getConstants: () => ({
    isRTL: false,
    doLeftAndRightSwapInRTL: false,
  }),
};

const PixelRatio = {
  get: () => 3,
  getFontScale: () => 1,
  roundToNearestPixel: (x) => Math.round(x),
};

const useColorScheme = () => 'light';

const StatusBar = createHostComponent('StatusBar');
StatusBar.currentHeight = 24;
StatusBar.setBarStyle = () => {};
StatusBar.setBackgroundColor = () => {};
StatusBar.setTranslucent = () => {};

const ReactNativeMock = {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  FlatList,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  AppState,
  NativeModules,
  Animated,
  Dimensions,
  I18nManager,
  PixelRatio,
  useColorScheme,
  StatusBar,
  default: null,
};
ReactNativeMock.default = ReactNativeMock;

module.exports = ReactNativeMock;
