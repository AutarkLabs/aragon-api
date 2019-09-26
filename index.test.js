"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _ava = _interopRequireDefault(require("ava"));

var _sinon = _interopRequireDefault(require("sinon"));

var _proxyquire = _interopRequireDefault(require("proxyquire"));

var _rxjs = require("rxjs");

const Index = _proxyquire.default.noCallThru().load('./index', {
  '@aragon/rpc-messenger': {}
});

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function createDeferredStub(observable) {
  return _sinon.default.stub().returns((0, _rxjs.defer)(() => observable));
}

function subscribe(observable, handler) {
  // Mimic an async delay to test the deferred behaviour
  sleep(10);
  observable.subscribe(handler);
}

_ava.default.afterEach.always(() => {
  _sinon.default.restore();
});

(0, _ava.default)('should send intent when the method does not exist in target', t => {
  t.plan(2); // arrange

  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: 10
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = Index.AppProxyHandler.get(instanceStub, 'add')(5); // assert

  subscribe(result, value => {
    t.is(value, 10);
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('intent', ['add', 5]));
});
(0, _ava.default)('should return the network details as an observable', t => {
  t.plan(2); // arrange

  const networkDetails = {
    id: 4,
    type: 'rinkeby'
  };
  const networkFn = Index.AppProxy.prototype.network;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: networkDetails
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observable)
    }
  }; // act

  const result = networkFn.call(instanceStub); // assert

  subscribe(result, value => {
    t.deepEqual(value, networkDetails);
  });
  t.truthy(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('network'));
});
(0, _ava.default)('should return the accounts as an observable', t => {
  t.plan(2); // arrange

  const accountsFn = Index.AppProxy.prototype.accounts;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: ['accountX', 'accountY', 'accountZ']
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observable)
    }
  }; // act

  const result = accountsFn.call(instanceStub); // assert

  subscribe(result, value => {
    t.deepEqual(value, ['accountX', 'accountY', 'accountZ']);
  });
  t.truthy(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('accounts'));
});
(0, _ava.default)('should send a getApps request for the current app and observe the single response', t => {
  t.plan(3);
  const currentApp = {
    appAddress: '0x456',
    appId: 'counterApp',
    appImplementationAddress: '0xcounterApp',
    identifier: 'counter',
    isForwarder: false,
    kernelAddress: '0x123',
    name: 'Counter'
  }; // arrange

  const currentAppFn = Index.AppProxy.prototype.currentApp;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: currentApp
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = currentAppFn.call(instanceStub); // assert

  subscribe(result, value => {
    t.is(value.icon(), undefined);
    delete value.icon;
    t.deepEqual(value, currentApp);
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('get_apps'));
});
(0, _ava.default)('should send a getApps request for installed apps and observe the response', t => {
  const initialApps = [{
    appAddress: '0x123',
    appId: 'kernel',
    appImplementationAddress: '0xkernel',
    identifier: undefined,
    isForwarder: false,
    kernelAddress: undefined,
    name: 'Kernel'
  }];
  const endApps = [].concat(initialApps, {
    appAddress: '0x456',
    appId: 'counterApp',
    appImplementationAddress: '0xcounterApp',
    identifier: 'counter',
    isForwarder: false,
    kernelAddress: '0x123',
    name: 'Counter'
  }); // arrange

  const installedAppsFn = Index.AppProxy.prototype.installedApps;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: initialApps
  }, {
    jsonrpc: '2.0',
    id: 'uuid1',
    result: endApps
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observable)
    }
  }; // act

  const result = installedAppsFn.call(instanceStub); // assert

  let emitIndex = 0;
  subscribe(result, value => {
    value.forEach(app => {
      t.is(app.icon(), undefined);
      delete app.icon;
    });

    if (emitIndex === 0) {
      t.deepEqual(value, initialApps);
    } else if (emitIndex === 1) {
      t.deepEqual(value, endApps);
    } else {
      t.fail('too many emissions');
    }

    emitIndex++;
  });
  t.true(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('get_apps'));
});
(0, _ava.default)('should send an identify request', t => {
  t.plan(1); // arrange

  const identifyFn = Index.AppProxy.prototype.identify;
  const instanceStub = {
    rpc: {
      send: _sinon.default.stub()
    }
  }; // act

  identifyFn.call(instanceStub, 'ANT'); // assert

  t.true(instanceStub.rpc.send.calledOnceWith('identify', ['ANT']));
});
(0, _ava.default)('should send a path request and observe the response', t => {
  t.plan(3); // arrange

  const pathFn = Index.AppProxy.prototype.path;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: 'path1'
  }, {
    jsonrpc: '2.0',
    id: 'uuid1',
    result: 'path2'
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observable)
    }
  }; // act

  const result = pathFn.call(instanceStub); // assert

  let emitIndex = 0;
  subscribe(result, value => {
    if (emitIndex === 0) {
      t.deepEqual(value, 'path1');
    } else if (emitIndex === 1) {
      t.deepEqual(value, 'path2');
    } else {
      t.fail('too many emissions');
    }

    emitIndex++;
  });
  t.true(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('path', ['observe']));
});
(0, _ava.default)('should send a path modification request', t => {
  t.plan(2); // arrange

  const path = 'new_path';
  const requestPathFn = Index.AppProxy.prototype.requestPath;
  const observable = (0, _rxjs.of)({
    jsonrpc: '2.0',
    id: 'uuid1',
    result: null
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = requestPathFn.call(instanceStub, path); // assert

  subscribe(result, value => t.is(value, null));
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('path', ['modify', path]));
});
(0, _ava.default)('should return the events observable', t => {
  t.plan(2); // arrange

  const eventsFn = Index.AppProxy.prototype.events;
  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: ['eventA', 'eventB']
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observable)
    }
  }; // act

  const result = eventsFn.call(instanceStub); // assert

  subscribe(result, value => {
    t.deepEqual(value, ['eventA', 'eventB']);
  });
  t.true(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('events', ['allEvents', {}]));
});
(0, _ava.default)('should return an handle for an external contract events', t => {
  t.plan(2);
  const fromBlock = 2; // arrange

  const externalFn = Index.AppProxy.prototype.external;
  const observableEvents = (0, _rxjs.of)({
    id: 'uuid1',
    result: {
      name: 'eventA',
      value: 3000
    }
  });
  const jsonInterfaceStub = [{
    type: 'event',
    name: 'SetPermission'
  }];
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(observableEvents)
    }
  }; // act

  const result = externalFn.call(instanceStub, '0xextContract', jsonInterfaceStub); // events from starting block

  const eventsObservable = result.events({
    fromBlock
  }); // assert

  subscribe(eventsObservable, value => {
    t.deepEqual(value, {
      name: 'eventA',
      value: 3000
    });
  });
  t.true(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('external_events', ['0xextContract', [jsonInterfaceStub[0]], 'allEvents', {
    fromBlock
  }]));
});
(0, _ava.default)('should return a handle for creating external calls', t => {
  t.plan(2); // arrange

  const externalFn = Index.AppProxy.prototype.external;
  const observableCall = (0, _rxjs.of)({
    id: 'uuid4',
    result: 'bob was granted permission for the counter app'
  });
  const jsonInterfaceStub = [{
    type: 'function',
    name: 'grantPermission',
    constant: true
  }];
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observableCall)
    }
  }; // act

  const result = externalFn.call(instanceStub, '0xextContract', jsonInterfaceStub);
  const callResult = result.grantPermission('0xbob', '0xcounter'); // assert

  subscribe(callResult, value => {
    t.is(value, 'bob was granted permission for the counter app');
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('external_call', ['0xextContract', jsonInterfaceStub[0], '0xbob', '0xcounter']));
});
(0, _ava.default)('should return a handle for creating external transaction intents', t => {
  t.plan(2); // arrange

  const externalFn = Index.AppProxy.prototype.external;
  const observableIntent = (0, _rxjs.of)({
    id: 'uuid4',
    result: 10
  });
  const jsonInterfaceStub = [{
    type: 'function',
    name: 'add',
    constant: false
  }];
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observableIntent)
    }
  }; // act

  const result = externalFn.call(instanceStub, '0xextContract', jsonInterfaceStub);
  const intentResult = result.add(10); // assert

  subscribe(intentResult, value => {
    t.is(value, 10);
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('external_intent', ['0xextContract', jsonInterfaceStub[0], 10]));
});
(0, _ava.default)('should return the state from cache', t => {
  t.plan(3); // arrange

  const stateFn = Index.AppProxy.prototype.state;
  const stateObservable = new _rxjs.Subject();
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponses: createDeferredStub(stateObservable)
    }
  }; // act

  const result = stateFn.call(instanceStub); // assert

  t.true(instanceStub.rpc.sendAndObserveResponses.calledOnceWith('cache', ['observe', 'state']));
  let counter = 0;
  subscribe(result, value => {
    if (counter === 0) {
      t.deepEqual(value, {
        counter: 5
      });
    } else if (counter === 1) {
      t.deepEqual(value, {
        counter: 6
      });
    }

    counter++;
  }); // send state events

  stateObservable.next({
    id: 'uuid1',
    result: {
      counter: 5
    }
  });
  stateObservable.next({
    id: 'uuid1',
    result: {
      counter: 6
    }
  });
});
(0, _ava.default)('should create a store and reduce correctly without previously cached state', async t => {
  t.plan(2); // arrange

  const storeFn = Index.AppProxy.prototype.store;
  const observableEvents = new _rxjs.Subject();
  const instanceStub = {
    accounts: () => (0, _rxjs.from)([['0x0000000000000000000000000000000000000abc']]),
    cache: () => (0, _rxjs.of)(),
    events: createDeferredStub(observableEvents),
    getCache: () => (0, _rxjs.from)([null]),
    pastEvents: () => (0, _rxjs.of)([]),
    web3Eth: _sinon.default.stub().withArgs('getBlockNumber').returns((0, _rxjs.from)(['4385398']))
  };

  const reducer = (state, action) => {
    if (state === null) state = {
      actionHistory: [],
      counter: 0
    };

    switch (action.event) {
      case 'Add':
        state.actionHistory.push(action);
        state.counter += action.payload;
        return state;

      case 'Subtract':
        state.actionHistory.push(action);
        state.counter -= action.payload;
        return state;
    }

    return state;
  }; // act


  const result = storeFn.call(instanceStub, reducer); // assert

  subscribe(result, value => {
    if (value.counter === 2) {
      t.deepEqual(value.actionHistory, [{
        event: 'Add',
        payload: 2
      }]);
    }

    if (value.counter === 12) {
      t.deepEqual(value.actionHistory, [{
        event: 'Add',
        payload: 2
      }, {
        event: 'Add',
        payload: 10
      }]);
    }
  }); // send events; wait to avoid grouping through debounce

  await sleep(250);
  observableEvents.next({
    event: 'Add',
    payload: 2
  });
  await sleep(500);
  observableEvents.next({
    event: 'Add',
    payload: 10
  });
  await sleep(1000);
});
(0, _ava.default)('should create a store and reduce correctly with previously cached state', async t => {
  t.plan(2); // arrange

  const storeFn = Index.AppProxy.prototype.store;
  const observableEvents = new _rxjs.Subject();
  const instanceStub = {
    accounts: () => (0, _rxjs.from)([['0x0000000000000000000000000000000000000abc']]),
    cache: () => (0, _rxjs.of)(),
    events: createDeferredStub(observableEvents),
    getCache: () => (0, _rxjs.of)({
      state: {
        actionHistory: [{
          event: 'Add',
          payload: 5
        }],
        counter: 5
      },
      blockNumber: 1
    }),
    pastEvents: () => (0, _rxjs.of)([]),
    web3Eth: _sinon.default.stub().withArgs('getBlockNumber').returns((0, _rxjs.from)(['4385398']))
  };

  const reducer = (state, action) => {
    if (state === null) state = {
      actionHistory: [],
      counter: 0
    };

    switch (action.event) {
      case 'Add':
        state.actionHistory.push(action);
        state.counter += action.payload;
        return state;

      case 'Subtract':
        state.actionHistory.push(action);
        state.counter -= action.payload;
        return state;
    }

    return state;
  }; // act


  const result = storeFn.call(instanceStub, reducer); // assert

  subscribe(result, value => {
    if (value.counter === 5) {
      t.deepEqual(value.actionHistory, [{
        event: 'Add',
        payload: 5
      }]);
    }

    if (value.counter === 7) {
      t.deepEqual(value.actionHistory, [{
        event: 'Add',
        payload: 5
      }, {
        event: 'Add',
        payload: 2
      }]);
    }

    if (value.counter === 17) {
      t.deepEqual(value.actionHistory, [{
        event: 'Add',
        payload: 5
      }, {
        event: 'Add',
        payload: 2
      }, {
        event: 'Add',
        payload: 10
      }]);
    }
  }); // send events; wait to avoid grouping through debounce

  await sleep(250);
  observableEvents.next({
    event: 'Add',
    payload: 2
  });
  await sleep(500);
  observableEvents.next({
    event: 'Add',
    payload: 10
  });
  await sleep(500);
});
(0, _ava.default)('should perform a call to the contract and observe the response', t => {
  t.plan(2); // arrange

  const callFn = Index.AppProxy.prototype.call;
  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: 'success'
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = callFn.call(instanceStub, 'transferEth', 10); // assert

  subscribe(result, value => {
    t.deepEqual(value, 'success');
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('call', ['transferEth', 10]));
});
(0, _ava.default)('should send a describeScript request and observe the response', t => {
  t.plan(2); // arrange

  const describeScriptFn = Index.AppProxy.prototype.describeScript;
  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: 'script executed'
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = describeScriptFn.call(instanceStub, 'goto fail'); // assert

  subscribe(result, value => {
    t.deepEqual(value, 'script executed');
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('describe_script', ['goto fail']));
});
(0, _ava.default)('should send a web3Eth function request and observe the response', t => {
  t.plan(2); // arrange

  const web3EthFn = Index.AppProxy.prototype.web3Eth;
  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: ['accountA', 'accountB']
  });
  const instanceStub = {
    rpc: {
      // Mimic behaviour of @aragon/rpc-messenger
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = web3EthFn.call(instanceStub, 'getAccounts', 5); // assert

  subscribe(result, value => {
    t.deepEqual(value, ['accountA', 'accountB']);
  });
  t.true(instanceStub.rpc.sendAndObserveResponse.calledOnceWith('web3_eth', ['getAccounts', 5]));
});
(0, _ava.default)('should return the registerAppMetadata observable', t => {
  t.plan(3); // arrange

  const registerAppMetadataFn = Index.AppProxy.prototype.registerAppMetadata;
  const instanceStub = {
    rpc: {
      send: _sinon.default.stub()
    }
  }; // act

  registerAppMetadataFn.call(instanceStub, '1', 'uuid1', 'QmrandomhashoceBBSBGmYiHVFQLHN8Uex6CeqExmp6Ggk', ['0xcafe']); // assert

  t.is(instanceStub.rpc.send.getCall(0).args[0], 'register_app_metadata');
  t.deepEqual(instanceStub.rpc.send.getCall(0).args[1], ['1', 'uuid1', 'QmrandomhashoceBBSBGmYiHVFQLHN8Uex6CeqExmp6Ggk', ['0xcafe']]); // act and assert default 'to'

  registerAppMetadataFn.call(instanceStub, '1', 'uuid2', 'QmrandomhashoceBBSBGmYiHVFQLHN8Uex6CeqExmp6GgK');
  t.deepEqual(instanceStub.rpc.send.getCall(1).args[1], ['1', 'uuid2', 'QmrandomhashoceBBSBGmYiHVFQLHN8Uex6CeqExmp6GgK', ['*']]);
});
(0, _ava.default)('should return individual metadata entry', t => {
  t.plan(3); // arrange

  const queryAppMetadataFn = Index.AppProxy.prototype.queryAppMetadata;
  const observable = (0, _rxjs.of)({
    id: 'uuid1',
    result: {
      from: '0xfed',
      to: ['0xcafe', '0xdeaddead'],
      dataId: 'u2',
      cid: 'Qmrandomhash'
    }
  });
  const instanceStub = {
    rpc: {
      sendAndObserveResponse: createDeferredStub(observable)
    }
  }; // act

  const result = queryAppMetadataFn.call(instanceStub, 'a', '1'); // assert

  t.is(instanceStub.rpc.sendAndObserveResponse.getCall(0).args[0], 'query_app_metadata');
  t.deepEqual(instanceStub.rpc.sendAndObserveResponse.getCall(0).args[1], ['a', '1']);
  result.subscribe(value => {
    t.deepEqual(value, {
      from: '0xfed',
      to: ['0xcafe', '0xdeaddead'],
      dataId: 'u2',
      cid: 'Qmrandomhash'
    });
  });
});
(0, _ava.default)('should return appMetadata observable', t => {
  t.plan(3); // arrange

  const getAppMetadataFn = Index.AppProxy.prototype.getAppMetadata;
  const observable = (0, _rxjs.from)([{
    event: 'AppMetadata',
    result: {
      from: '0xfed',
      to: ['0xcafe', '0xdeaddead'],
      dataId: 'u2',
      cid: 'Qmrandomhash'
    }
  }]);
  const instanceStub = {
    rpc: {
      sendAndObserveResponses: _sinon.default.stub().returns(observable)
    }
  }; // act

  const result = getAppMetadataFn.call(instanceStub); // assert

  t.truthy(instanceStub.rpc.sendAndObserveResponses.getCall(0));
  result.subscribe(value => {
    t.deepEqual(value, {
      from: '0xfed',
      to: ['0xcafe', '0xdeaddead'],
      dataId: 'u2',
      cid: 'Qmrandomhash'
    });
  });
  t.is(instanceStub.rpc.sendAndObserveResponses.getCall(0).args[0], 'get_app_metadata');
});
(0, _ava.default)('should submit a new action', t => {
  t.plan(2); // arrange

  const newActionFn = Index.AppProxy.prototype.newForwardedAction;
  const instanceStub = {
    rpc: {
      send: _sinon.default.stub()
    }
  }; // act

  newActionFn.call(instanceStub, '0', '49', 'testScript'); // assert

  t.is(instanceStub.rpc.send.getCall(0).args[0], 'update_forwarded_action');
  t.deepEqual(instanceStub.rpc.send.getCall(0).args[1], ['0', '49', 'testScript']);
});
(0, _ava.default)('should update an action', t => {
  t.plan(4); // arrange

  const updateActionFn = Index.AppProxy.prototype.updateForwardedAction;
  const instanceStub = {
    rpc: {
      send: _sinon.default.stub()
    }
  };
  const instanceStub2 = {
    rpc: {
      send: _sinon.default.stub()
    }
  }; // act

  updateActionFn.call(instanceStub, '1', '49', 'testScript', '0'); // assert

  t.is(instanceStub.rpc.send.getCall(0).args[0], 'update_forwarded_action');
  t.deepEqual(instanceStub.rpc.send.getCall(0).args[1], ['1', '49', 'testScript', '0']); // act

  updateActionFn.call(instanceStub2, '2', '49', 'updatedScript', '1'); // assert

  t.is(instanceStub2.rpc.send.getCall(0).args[0], 'update_forwarded_action');
  t.deepEqual(instanceStub2.rpc.send.getCall(0).args[1], ['2', '49', 'updatedScript', '1']);
});
(0, _ava.default)('should return the forwardedActions observable', t => {
  t.plan(3); // arrange

  const getFwdActionsFn = Index.AppProxy.prototype.getForwardedActions;
  const observable = (0, _rxjs.of)({
    event: 'uuid1',
    result: {
      event: 'ForwardedActions',
      returnValues: ['forwardedAction1', 'forwardedAction2']
    }
  });
  const instanceStub = {
    rpc: {
      sendAndObserveResponses: _sinon.default.stub().returns(observable)
    }
  }; // act

  const result = getFwdActionsFn.call(instanceStub); // assert
  // the call to sendAndObserveResponse should not be defered until we subscribe,
  // since we are working with a BehaviorSubject and just want the latest and greatest

  t.truthy(instanceStub.rpc.sendAndObserveResponses.getCall(0));
  result.subscribe(value => {
    t.deepEqual(value, {
      event: 'ForwardedActions',
      returnValues: ['forwardedAction1', 'forwardedAction2']
    });
  });
  t.is(instanceStub.rpc.sendAndObserveResponses.getCall(0).args[0], 'get_forwarded_actions');
});
(0, _ava.default)('should send a trigger request to the wrapper', t => {
  t.plan(2); // arrange

  const triggerFn = Index.AppProxy.prototype.trigger;
  const instanceStub = {
    rpc: {
      send: _sinon.default.stub()
    }
  }; // act

  triggerFn.call(instanceStub, 'TriggerTest', {
    testprop: '123abc'
  }); // assert

  t.is(instanceStub.rpc.send.getCall(0).args[0], 'trigger');
  t.deepEqual(instanceStub.rpc.send.getCall(0).args[1], ['TriggerTest', {
    testprop: '123abc'
  }]);
});
//# sourceMappingURL=index.test.js.map