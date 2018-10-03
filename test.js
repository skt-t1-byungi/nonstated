import test from 'ava'
import renderer from 'react-test-renderer'
import { createElement } from 'react'
import { Container, subscribe } from '.'

test('basic', async t => {
    const counter = new class extends Container {
        constructor () {
            super()
            this.state = { num: 0 }
        }
        increment () {
            return this.setState(s => ({ num: s.num + 1 }))
        }
        decrement () {
            return this.setState(s => ({ num: s.num - 1 }))
        }
    }()
    const View = subscribe([counter])(() => counter.state.num)

    const component = renderer.create(createElement(View))
    t.is(component.toJSON(), '0')

    await counter.increment()
    t.is(component.toJSON(), '1')
    await counter.increment()
    t.is(component.toJSON(), '2')
    await counter.decrement()
    t.is(component.toJSON(), '1')
})
