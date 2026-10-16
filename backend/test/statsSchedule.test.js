const assert = require('node:assert/strict')
const { test } = require('node:test')
const { updateStats } = require('../schedule/statsSchedule')

test('registra falha de conexão no agendador sem rejeição não tratada', async () => {
    const errors = []
    const originalError = console.error
    console.error = (...args) => errors.push(args)

    try {
        await assert.doesNotReject(updateStats({
            db() {
                throw new Error('Banco temporariamente indisponível')
            }
        }))
    } finally {
        console.error = originalError
    }

    assert.equal(errors.length, 1)
    assert.match(errors[0][0], /Não foi possível atualizar as estatísticas/)
    assert.match(errors[0][1].message, /temporariamente indisponível/)
})
