import test from 'ava'
import renderer from 'react-test-renderer'
import { createElement } from 'react'
import { Container, subscribe } from '.'

class CounterContainer extends Container {
    constructor () {
        super()
        this.state = { val: 0 }
    }
    increment () {
        return this.setState(s => ({ val: s.val + 1 }))
    }
    decrement () {
        return this.setState(s => ({ val: s.val - 1 }))
    }
}

test('basic usage', async t => {
    const counter = new CounterContainer()
    const component = renderer.create(createElement(subscribe(counter)(() => counter.state.val)))

    t.is(component.toJSON(), '0')
    await counter.increment()
    t.is(component.toJSON(), '1')
    await counter.increment()
    t.is(component.toJSON(), '2')
    await counter.decrement()
    t.is(component.toJSON(), '1')
})

test('container.on() test', async t => {
    const counter = new CounterContainer()
    const component = renderer.create(counter.on(s => s.val))

    t.is(component.toJSON(), '0')
    await counter.increment()
    t.is(component.toJSON(), '1')
    await counter.increment()
    t.is(component.toJSON(), '2')
    await counter.decrement()
    t.is(component.toJSON(), '1')
})
