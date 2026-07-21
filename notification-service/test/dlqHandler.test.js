const test = require('node:test');
const assert = require('node:assert/strict');
const { withDLQ } = require('../../shared/utils/dlqHandler');

const createPayload = (value) => ({
    topic: 'otp-email',
    partition: 0,
    message: {
        key: Buffer.from('user@example.com'),
        value: Buffer.from(value),
        offset: '12',
    },
});

const logger = {
    error() { },
    warn() { },
    info() { },
};

test('passes parsed JSON to the notification handler', async () => {
    let received;
    const producer = {
        async send() {
            assert.fail('DLQ producer should not be called for a valid message');
        },
    };
    const handler = async ({ parsedValue }) => {
        received = parsedValue;
    };

    await withDLQ(producer, 'notification-dlq', logger, handler)(
        createPayload('{"email":"user@example.com","otp":"123456"}'),
    );

    assert.deepEqual(received, {
        email: 'user@example.com',
        otp: '123456',
    });
});

test('publishes invalid messages to the dead-letter topic', async () => {
    let published;
    const producer = {
        async send(record) {
            published = record;
        },
    };

    await withDLQ(producer, 'notification-dlq', logger, async () => { })(
        createPayload('not-json'),
    );

    assert.equal(published.topic, 'notification-dlq');
    assert.equal(published.messages[0].value.toString(), 'not-json');
    assert.equal(published.messages[0].headers['dlq-original-topic'], 'otp-email');
    assert.equal(published.messages[0].headers['dlq-original-offset'], '12');
});