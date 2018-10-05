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
        return this.setState({ val: this.state.val + 1 })
    }
    decrement () {
        return this.setState({ val: this.state.val - 1 })
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

test.only('nested subscribe', async t => {
    const counter = new CounterContainer()
    let calls = 0

    const Child1 = subscribe(counter)(() => {
        calls++
        return 'child'
    })

    const Child2 = subscribe(counter)(() => {
        calls++
        return createElement(Child1)
    })

    const Parent = subscribe(counter)(() => {
        calls++
        return createElement(Child2)
    })

    renderer.create(createElement(Parent))
    t.is(calls, 3)
    await counter.increment()
    t.is(calls, 6)
})
