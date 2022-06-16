// @flow

import { put, call } from 'redux-saga/effects';
import {
  Device,
  Service,
  Characteristic,
  Descriptor,
  BleError,
  BleErrorCode,
} from 'react-native-ble-plx';
import { log, logError, weightData } from './Reducer';

export type SensorTagTestMetadata = {
  id: string,
  title: string,
  execute: (device: Device) => Generator<any, boolean, any>,
};

export const SensorTagTests: { [string]: SensorTagTestMetadata } = {
  READ_ALL_CHARACTERISTICS: {
    id: 'READ_ALL_CHARACTERISTICS',
    title: 'Read all characteristics',
    execute: readAllCharacteristics,
  },
  READ_WEIGHT_SENSOR_INFO: {
    id: 'READ_WEIGHT_SENSOR_INFO',
    title: 'Read Weight Sensor Info',
    execute: readWeightSensorInfo,
  },
  READ_WEIGHT_DATA: {
    id: 'READ_WEIGHT_DATA',
    title: 'Read Weight Data',
    execute: readWeightData,
  },
};

// const Buffer = require("buffer").Buffer;
// let encodedAuth = new Buffer("your text").toString("base64");
import base64 from 'react-native-base64'


function* readAllCharacteristics(device: Device): Generator<*, boolean, *> {
  try {
    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      yield put(log('Found service: ' + service.uuid));
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        yield put(log('Found characteristic: ' + characteristic.uuid));

        if (characteristic.uuid === '00002a02-0000-1000-8000-00805f9b34fb')
          continue;

        const descriptors: Array<Descriptor> = yield call([
          characteristic,
          characteristic.descriptors,
        ]);

        for (const descriptor of descriptors) {
          yield put(log('* Found descriptor: ' + descriptor.uuid));
          const d: Descriptor = yield call([descriptor, descriptor.read]);
          yield put(log('Descriptor value: ' + (d.value || 'null')));
          if (d.uuid === '00002902-0000-1000-8000-00805f9b34fb') {
            //            yield put(log('Skipping CCC'));
            continue;
          }
          try {
            yield call([descriptor, descriptor.write], 'AAA=');
          } catch (error) {
            const bleError: BleError = error;
            if (bleError.errorCode === BleErrorCode.DescriptorWriteFailed) {
              yield put(log('Cannot write to: ' + d.uuid));
            } else {
              throw error;
            }
          }
        }

        yield put(log('Found characteristic: ' + characteristic.uuid));
        if (characteristic.isReadable) {
          yield put(log('Reading value...'));
          var c = yield call([characteristic, characteristic.read]);
          yield put(log('Got base64 value: ' + c.value));
          if (characteristic.isWritableWithResponse) {
            yield call(
              [characteristic, characteristic.writeWithResponse],
              c.value,
            );
            yield put(log('Successfully written value back'));
          }
        }
      }
    }
  } catch (error) {
    yield put(logError(error));
    return false;
  }

  return true;
}

function* readWeightSensorInfo(device: Device): Generator<*, boolean, *> {
  yield put(log('Read Weight Sensor Info'));

  try {
    yield (device.requestMTU(517));

    var chRead = null;

    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      //yield put(log('* Found service: ' + service.uuid));
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        //yield put(log('** Found characteristic: ' + characteristic.uuid));

        if (characteristic.uuid.startsWith('0000'))
          continue;

        if (characteristic.uuid == '6e400002-b5a3-f393-e0a9-e50e24dcca9e') {
          var command = 'getWeightSensorInfo';
          yield put(log('Writing: ' + command));
          var enc = base64.encode(command);
          var char = yield call([characteristic, characteristic.writeWithResponse], enc);
          if (chRead) {
            //            yield put(log('Reading'));
            var res = yield call([chRead, chRead.read]);
            if (res != null) {
              var dec = base64.decode(res.value);
              yield put(log('Got string value: ' + dec));
            }
          }
        }

        if (characteristic.uuid == '6e400003-b5a3-f393-e0a9-e50e24dcca9e') {
          chRead = characteristic;
          var res = yield call([characteristic, characteristic.read]);
          if (characteristic.value != null) {
            var dec = base64.decode(characteristic.value);
            yield put(log('Got string value: ' + dec));
          }
        }

        const descriptors: Array<Descriptor> = yield call([
          characteristic,
          characteristic.descriptors,
        ]);

        for (const descriptor of descriptors) {

          if (descriptor.uuid === '00002902-0000-1000-8000-00805f9b34fb') {
            //            yield put(log('Skipping CCC'));
            continue;
          }

          yield put(log('*** Found descriptor: ' + descriptor.uuid));
          const d: Descriptor = yield call([descriptor, descriptor.read]);
          yield put(log('Descriptor value: ' + (d.value || 'null')));
        }
      }
    }
  } catch (error) {
    yield put(logError(error));
    yield put(weightData(0));
    return false;
  }

  return true;
}

function* readWeightData(device: Device): Generator<*, boolean, *> {
  yield put(log('Read Weight Data'));

  try {
    yield (device.requestMTU(517));

    var chRead = null;

    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      //yield put(log('* Found service: ' + service.uuid));
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        //yield put(log('** Found characteristic: ' + characteristic.uuid));

        if (characteristic.uuid.startsWith('0000'))
          continue;

        if (characteristic.uuid == '6e400002-b5a3-f393-e0a9-e50e24dcca9e') {
          var command = 'getWeightReading';
          yield put(log('Writing: ' + command));
          var enc = base64.encode(command);
          var char = yield call([characteristic, characteristic.writeWithResponse], enc);
          if (chRead) {
            //yield put(log('Reading'));
            var res = yield call([chRead, chRead.read]);
            if (res != null) {
              var dec = base64.decode(res.value);
              yield put(log('Got string value: ' + dec));

              // extract json string / value
              var json = JSON.parse(dec);
              var firstKey = Object.values(json)[0];
              // Weight Data
              yield put(weightData(firstKey));
            }
          }
        }

        if (characteristic.uuid == '6e400003-b5a3-f393-e0a9-e50e24dcca9e') {
          chRead = characteristic;
          var res = yield call([characteristic, characteristic.read]);
          if (characteristic.value != null) {
            var dec = base64.decode(characteristic.value);
            yield put(log('Got string value: ' + dec));
          }
        }

        const descriptors: Array<Descriptor> = yield call([
          characteristic,
          characteristic.descriptors,
        ]);

        for (const descriptor of descriptors) {

          if (descriptor.uuid === '00002902-0000-1000-8000-00805f9b34fb') {
            //            yield put(log('Skipping CCC'));
            continue;
          }

          yield put(log('*** Found descriptor: ' + descriptor.uuid));
          const d: Descriptor = yield call([descriptor, descriptor.read]);
          yield put(log('Descriptor value: ' + (d.value || 'null')));
        }
      }
    }
  } catch (error) {
    yield put(logError(error));
    return false;
  }

  return true;
}

