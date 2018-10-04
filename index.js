import React from 'react'
import equal from 'fast-deep-equal'

let uuid = 0
const MAX_SAFE_INTEGER = 9007199254740991

export class Container {
    constructor () {
        this.state = null
        this.$$updateId = null
        this.$$Box = null
        this.$$components = []
    }

    setState (updater) {
        return Promise.resolve().then(() => {
            if (uuid === MAX_SAFE_INTEGER) uuid = -MAX_SAFE_INTEGER
            const updateId = this.$$updateId = uuid++

            const prevState = this.state
            const nextState = typeof updater === 'function' ? updater(prevState) : updater

            if (!nextState) return

            this.state = { ...prevState, ...Object(nextState) }
            return Promise.all(this.$$components.slice().reverse().map(c => c.onUpdate(this, updateId)))
        })
    }

    $$subscribe (component) {
        this.$$components.push(component)
    }

    $$unsubscribe (component) {
        this.$$components = this.$$components.filter(c => c !== component)
    }

    on (render) {
        if (!this.$$Box) {
            this.$$Box = subscribe(this)(({ state, children }) => children(state))
        }

        return React.createElement(this.$$Box, null, render)
    }
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
            }

            getState () {
                const states = containers.length === 1 ? containers[0].state : containers.map(c => c.state)
                return selector(states, this.props)
            }

            componentDidMount () {
                containers.forEach(container => container.$$subscribe(this))
            }

            componentWillUnmount () {
                containers.forEach(container => container.$$unsubscribe(this))
            }

            componentDidUpdate () {
                this._updateIds = containers.map(container => container.$$updateId)
            }

            onUpdate (container, updateId) {
                return new Promise(resolve => {
                    if (this._updateIds.indexOf(updateId) > -1) return resolve()

                    const idx = containers.indexOf(container)
                    this._updateIds[idx] = updateId

                    const nextState = this.getState()
                    if (equal(nextState, this._state)) return resolve()

                    this._state = nextState
                    this.forceUpdate(resolve)
                })
            }

            render () {
                return React.createElement(Wrapped, { ...this.props, state: this._state })
            }
        }

        return SubscribeWrap
    }
}
