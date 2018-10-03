import React from 'react'
import equal from 'fast-deep-equal'

let uuid = 0

export class Container {
    constructor () {
        this.state = null
        this.$$updateId = null
        this.$$components = []
    }

    $$subscribe (component) {
        this.$$components.unshift(component)
    }

    $$unsubscribe (component) {
        this.$$components = this.$$components.filter(c => c !== component)
    }

    setState (updater) {
        return Promise.resolve().then(() => {
            const updateId = this.$$updateId = uuid++

            const prevState = this.state
            const nextState = typeof updater === 'function' ? updater(prevState) : updater

            if (!nextState) return

            this.state = { ...prevState, ...Object(nextState) }
            return Promise.all(this.$$components.map(c => c.onUpdate(this, updateId)))
        })
    }
}

const passThrough = v => v

export function subscribe (containers, selector = passThrough) {
    return makeDecorator([].concat(containers), selector)
}

export function subscribeOnly (containers, selector = passThrough) {
    return makeDecorator([].concat(containers), selector, true)
}

function makeDecorator (containers, selector, isPure) {
    const getState = () => selector(containers.map(c => c.state))
    const Component = isPure ? React.PureComponent : React.Component

    return Wrapped => {
        class SubscribeWrap extends Component {
            constructor (props) {
                super(props)
                this._updateIds = Array(containers.length)
                this._state = getState()
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

                    const nextState = getState()
                    if (equal(nextState, this._state)) return resolve()

                    this._state = nextState
                    this.forceUpdate(resolve)
                })
            }

            render () {
                return React.createElement(Wrapped, this.props)
            }
        }

        return SubscribeWrap
    }
}
