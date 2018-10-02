import React from 'react'

let uuid = 0

export class Container {
    constructor () {
        this.state = null
        this._components = []
    }

    subscribe (component) {
        this._components.push(component)
    }

    unsubscribe (component) {
        this._components = this._components.filter(c => c !== component)
    }

    setState (updater) {
        if (typeof updater !== 'function') updater = () => updater

        return Promise.resolve().then(() => {
            const updateId = uuid++
            const prevState = this.state
            const newState = updater(prevState)
            if (!newState) return
            this.state = { ...prevState, ...Object(newState) }
            const promises = this._components.map(c => c.onUpdate(updateId))
            return Promise.all(promises)
        })
    }
}

const pass = s => s

export function subscribeOnly (container, selector = pass) {
    return makeDecorator(container, () => selector(container.state), React.PureComponent)
}

export function subscribe (container, selector = pass) {
    return makeDecorator(container, () => selector(container.state))
}

function makeDecorator (container, getState, Component = React.Component) {
    return Wrapped =>
        class SubscribeWrap extends Component {
            constructor (props) {
                super(props)
                this._lastUpdateId = null
                this._state = getState()
            }

            componentDidMount () {
                container.subscribe(this)
            }

            componentWillUnmount () {
                container.unsubscribe(this)
            }

            onUpdate (updateId) {
                return new Promise(resolve => {
                    if (this._lastUpdateId === updateId) return resolve()
                    this._lastUpdateId = updateId

                    const state = getState()
                    if (state === this._state) return resolve()

                    this._state = state
                    this.forceUpdate(resolve)
                })
            }

            render () {
                return <Wrapped {...this.props} />
            }
        }
}
