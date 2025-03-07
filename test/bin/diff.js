const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const consoleLog = console.log;
const processExit = process.exit;

const stub = {
  async '../lib/rule-finder'() {
    return {
      getCurrentRules() {}, // Noop
      getCurrentRulesDetailed() {} // Noop
    };
  },
  '../lib/array-diff': sinon.stub().returns(['diff']),
  '../lib/object-diff': sinon.stub().returns([{'test-rule': {config1: 'foo-config', config2: 'bar-config'}}])
};

let exitStatus;

describe('diff', () => {
  beforeEach(() => {
    process.argv = process.argv.slice(0, 2);
    sinon.stub(console, 'log').callsFake((...args) => {
      // Print out everything but the test target's output
      if (!args[0].match(/diff/)) {
        consoleLog(...args);
      }
    });
    exitStatus = new Promise(resolve => {
      process.exit = resolve;
    });
  });

  afterEach(() => {
    console.log.restore();
    process.exit = processExit;
    // purge yargs cache
    delete require.cache[require.resolve('yargs')];
  });

  it('logs diff', async () => {
    process.argv[2] = './foo';
    process.argv[3] = './bar';
    proxyquire('../../src/bin/diff', stub);
    assert.strictEqual(await exitStatus, 0);
    assert.ok(
      console.log.calledWith(
        sinon.match(
          /diff rules[^]*in foo but not in bar:[^]*diff[^]*in bar but not in foo:[^]*diff/
        )
      )
    );
  });

  it('logs diff verbosely', async () => {
    process.argv[2] = '--verbose';
    process.argv[3] = './foo';
    process.argv[4] = './bar';
    proxyquire('../../src/bin/diff', stub);
    assert.strictEqual(await exitStatus, 0);
    assert.ok(
      console.log.calledWith(
        sinon.match(
          /diff rules[^]*foo[^]*bar[^]*test-rule[^]*foo-config[^]*bar-config/
        )
      )
    );
  });
});
