// @flow

import { State, Device, BleError, ConnectionOptions } from 'react-native-ble-plx';

export type Action =
  | LogAction
  | ClearLogsAction
  | ConnectAction
  | ConnectWithOptionsAction
  | DisconnectAction
  | UpdateConnectionStateAction
  | BleStateUpdatedAction
  | SensorTagFoundAction
  | ForgetSensorTagAction
  | StartMonitoringAction
  | ExecuteTestAction
  | TestFinishedAction;

export type LogAction = {|
  type: 'LOG',
    message: string,
|};


export type WeightDataAction = {|
  type: 'WEIGHT',
    weight: Number,
|};

export type ClearLogsAction = {|
  type: 'CLEAR_LOGS',
|};

export type ConnectWithOptionsAction = {|
  type: 'CONNECT_WITH_OPTIONS',
    device: Device,
      options: ConnectionOptions,
|};

export type ConnectAction = {|
  type: 'CONNECT',
    device: Device,
|};

export type DisconnectAction = {|
  type: 'DISCONNECT',
|};

export type UpdateConnectionStateAction = {|
  type: 'UPDATE_CONNECTION_STATE',
    state: $Keys < typeof ConnectionState >,
|};

export type BleStateUpdatedAction = {|
  type: 'BLE_STATE_UPDATED',
    state: $Keys < typeof State >,
|};

export type SensorTagFoundAction = {|
  type: 'SENSOR_TAG_FOUND',
    device: Device,
|};

export type ForgetSensorTagAction = {|
  type: 'FORGET_SENSOR_TAG',
|};

export type StartMonitoringAction = {|
  type: 'START_MONITORING',
|};

export type ExecuteTestAction = {|
  type: 'EXECUTE_TEST',
    id: string,
|};

export type TestFinishedAction = {|
  type: 'TEST_FINISHED',
|};

export type ReduxState = {
  logs: Array<string>,
  activeError: ?BleError,
  activeSensorTag: ?Device,
  isMonitoring: Boolean,
  weightData: Number,
  connectionState: $Keys<typeof ConnectionState>,
  currentTest: ?string,
  bleState: $Keys<typeof State>,
};

export const ConnectionState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  DISCOVERING: 'DISCOVERING',
  CONNECTED: 'CONNECTED',
  DISCONNECTING: 'DISCONNECTING',
};

export const initialState: ReduxState = {
  bleState: State.Unknown,
  activeError: null,
  activeSensorTag: null,
  isMonitoring: false,
  weightData: 0,
  connectionState: ConnectionState.DISCONNECTED,
  currentTest: null,
  logs: [],
};

export function log(message: string): LogAction {
  return {
    type: 'LOG',
    message,
  };
}

export function weightData(weight: Number) {
  return {
    type: 'WEIGHT',
    weight,
  };
}

export function logError(error: BleError) {
  return log(
    'ERROR: ' +
    error.message +
    ', ATT: ' +
    (error.attErrorCode || 'null') +
    ', iOS: ' +
    (error.iosErrorCode || 'null') +
    ', android: ' +
    (error.androidErrorCode || 'null') +
    ', reason: ' +
    (error.reason || 'null'),
  );
}

export function clearLogs(): ClearLogsAction {
  return {
    type: 'CLEAR_LOGS',
  };
}

export function connect(device: Device): ConnectAction {
  return {
    type: 'CONNECT',
    device,
  };
}

export function connectWithOptions(device: Device, options: ConnectionOptions): ConnectWithOptionsAction {
  return {
    type: 'CONNECT_WITH_OPTIONS',
    device,
    options,
  };
}

export function updateConnectionState(
  state: $Keys<typeof ConnectionState>,
): UpdateConnectionStateAction {
  return {
    type: 'UPDATE_CONNECTION_STATE',
    state,
  };
}

export function disconnect(): DisconnectAction {
  return {
    type: 'DISCONNECT',
  };
}

export function bleStateUpdated(
  state: $Keys<typeof State>,
): BleStateUpdatedAction {
  return {
    type: 'BLE_STATE_UPDATED',
    state,
  };
}

export function sensorTagFound(device: Device): SensorTagFoundAction {
  return {
    type: 'SENSOR_TAG_FOUND',
    device,
  };
}

export function forgetSensorTag(): ForgetSensorTagAction {
  return {
    type: 'FORGET_SENSOR_TAG',
  };
}

export function startMonitoring(): StartMonitoringAction {
  return {
    type: 'START_MONITORING',
  };
}

export function executeTest(id: string): ExecuteTestAction {
  return {
    type: 'EXECUTE_TEST',
    id,
  };
}

export function testFinished(): TestFinishedAction {
  return {
    type: 'TEST_FINISHED',
  };
}

export function reducer(
  state: ReduxState = initialState,
  action: Action,
): ReduxState {
  switch (action.type) {
    case 'LOG':
      return { ...state, logs: [action.message, ...state.logs] };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    case 'UPDATE_CONNECTION_STATE':
      return {
        ...state,
        connectionState: action.state,
        logs: ['Connection state changed: ' + action.state, ...state.logs],
      };
    case 'BLE_STATE_UPDATED':
      return {
        ...state,
        bleState: action.state,
        logs: ['BLE state changed: ' + action.state, ...state.logs],
      };
    case 'SENSOR_TAG_FOUND':
      if (state.activeSensorTag) return state;
      return {
        ...state,
        activeSensorTag: action.device,
        logs: ['SensorTag found: ' + action.device.id, ...state.logs],
      };
    case 'FORGET_SENSOR_TAG':
      return {
        ...state,
        activeSensorTag: null,
      };
    case 'START_MONITORING':
      return {
        ...state,
        isMonitoring: true,
      };
    case 'WEIGHT':
      return {
        ...state,
        weightData: action.weight,
      };
    case 'EXECUTE_TEST':
      if (state.connectionState !== ConnectionState.CONNECTED) {
        return state;
      }
      return { ...state, currentTest: action.id };
    case 'TEST_FINISHED':
      return { ...state, currentTest: null };
    default:
      return state;
  }
}
