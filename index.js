import React from 'react'
import equal from 'fast-deep-equal'
import assign from 'object-assign'
import includes from '@skt-t1-byungi/array-includes'

const MAX_SAFE_INTEGER = 9007199254740991
let uuid = 0

export class Container {
    constructor () {
        this.state = null
        this.$$updateId = null
        this.$$Box = null
        this.$$components = []
    }

    setState (updater) {
        return new Promise(resolve => {
            if (uuid === MAX_SAFE_INTEGER) uuid = -MAX_SAFE_INTEGER
            const updateId = this.$$updateId = uuid++

            const prevState = this.state
            const nextState = typeof updater === 'function' ? updater(prevState) : updater

            if (!nextState) return resolve()

            this.state = assign({}, prevState, Object(nextState))
            Promise.all(this.$$components.slice().reverse().map(c => c.onUpdate(updateId))).then(resolve, resolve)
        })
    }

    $$subscribe (component) {
        this.$$components.push(component)
    }

    $$unsubscribe (component) {
        this.$$components = this.$$components.filter(c => c !== component)
    }

    on (selector, render) {
        if (!render) {
            render = selector
            selector = passThrough
        }

        if (!this.$$Box) this.$$Box = subscribe(this)(Box)
        return React.createElement(this.$$Box, { __selector__: selector, render })
    }
}

function Box ({ state, render }) {
    return render(state)
}

function passThrough (v) {
    return v
}

export function subscribe (containers, selector = passThrough) {
    return makeDecorator([].concat(containers), selector)
}

export function subscribeOnly (containers, selector = passThrough) {
    return makeDecorator([].concat(containers), selector, true)
}

function makeDecorator (containers, selector, isPure) {
    const Component = isPure ? React.PureComponent : React.Component

    return Wrapped => {
        class SubscribeWrap extends Component {
            constructor (props) {
                super(props)
                this._updateIds = Array(containers.length)
                this._state = this.getState()
                this._unmounted = false
            }

            getState () {
                const states = containers.length === 1 ? containers[0].state : containers.map(c => c.state)
                return (this.props.__selector__ || selector)(states, this.props)
            }

            componentDidMount () {
                containers.forEach(container => container.$$subscribe(this))
            }

            componentWillUnmount () {
                this._unmounted = true
                containers.forEach(container => container.$$unsubscribe(this))
            }

            componentDidUpdate () {
                this._updateIds = containers.map(container => container.$$updateId)
            }

            onUpdate (updateId) {
                return new Promise(resolve => {
                    if (this._unmounted || includes(this._updateIds, updateId)) return resolve()

                    const nextState = this.getState()
                    if (equal(nextState, this._state)) return resolve()

                    this._state = nextState
                    this.forceUpdate(resolve)
                })
            }

            render () {
                return React.createElement(Wrapped, assign({}, this.props, { state: this._state }))
            }
        }

        return SubscribeWrap
    }
}
