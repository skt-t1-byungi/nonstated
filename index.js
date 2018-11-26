import React from 'react'
import equal from 'fast-deep-equal'
import assign from 'object-assign'
import includes from '@skt-t1-byungi/array-includes'

const Context = React.createContext()
const EMPTY_STATE = {}
const DEFAULT_CONTAINERS = []
let uuid = 0

export class Provider extends React.Component {
    constructor (props) {
        super(props)
        this.containers = this.props.inject || DEFAULT_CONTAINERS
        this.state = this.getState()
    }

    getState () {
        return this.containers.reduce((acc, container) => {
            acc[container.$$id] = container.state
            return acc
        }, {})
    }

    componentDidMount () {
        this.containers.forEach(container => (container.$$provider = this))
    }

    componentWillUnmount () {
        this.containers.forEach(container => (container.$$provider = null))
    }

    setStateById (id, nextState) {
        return new Promise(resolve => this.setState({ [id]: nextState }, resolve))
    }

    render () {
        return <Context.Provider value={this.state}>{this.props.children}</Context.Provider>
    }
}

export class Container {
    constructor () {
        this.$$id = uuid++
        this.$$provider = null
        this.$$Box = null
        this.state = EMPTY_STATE
    }

    setState (nextState) {
        if (this.$$provider) {
            return this.$$provider.setStateById(this.$$id, nextState).then(() => {
                this.state = this.$$provider.state
            })
        } else {
            const prevState = this.state
            nextState = typeof nextState === 'function' ? nextState(prevState) : nextState
            this.state = assign({}, prevState, nextState)
            return Promise.resolve()
        }
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
    return makeDecorator([].concat(containers), selector, false)
}

export function subscribeOnly (containers, selector = passThrough) {
    return makeDecorator([].concat(containers), selector, true)
}

function makeDecorator (containers, selector, isPure) {
    DEFAULT_CONTAINERS.push(...containers.filter(c => !includes(DEFAULT_CONTAINERS, c)))

    const Component = isPure ? React.PureComponent : React.Component

    return Wrapped =>
        class SubscribeWrap extends Component {
            constructor (props) {
                super(props)
                this.renderedChildren = null
                this.prevState = null
                this.renderHandler = this.renderHandler.bind(this)
            }

            render () {
                return <Context.Consumer>{this.renderHandler}</Context.Consumer>
            }

            renderHandler (providerState) {
                const currState = this.mapState(providerState)

                if (!this.renderedChildren || !equal(currState, this.prevState)) {
                    this.renderedChildren = React.createElement(Wrapped, assign({}, this.props, { state: currState }))
                    this.prevState = currState
                }

                return this.renderedChildren
            }

            mapState (providerState) {
                const state = containers.map(c => providerState[c.$$id])
                return (this.props.__selector__ || selector)(state.length === 1 ? state[0] : state, this.props)
            }
        }
}
