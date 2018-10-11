import includes from '@skt-t1-byungi/array-includes'
import equal from 'fast-deep-equal'
import assign from 'object-assign'
import React from 'react'

const MAX_SAFE_INTEGER = 9007199254740991
let uuid = 0

type Updater<S extends {}> = (state: S) => Partial<S> | void
type Selector<S,P,R> = (state: S | S[], props: P) => R
type WithSelector<P,R> = P & {__selector__?: Selector<any,P,R>}
type Render<S> = (state: S) => any
type BoxProps<S> = WithSelector<{render: Render<S>}, any>
type BoxComponent<S> = React.ComponentClass<BoxProps<S>>
type BoxElement<S> = React.ComponentElement<BoxProps<S>, any>
export interface SubscribeWrapper extends React.Component { onUpdate (updateId: number): Promise<void> }

export class Container<State extends {} = any> {
    public state!: State
    public $$updateId?: number
    public $$components: SubscribeWrapper[] = []
    private $$Box?: BoxComponent<any>

    public setState (updater?: Updater<State> | Partial<State>) {
        return Promise.resolve().then(() => {
            if (uuid === MAX_SAFE_INTEGER) uuid = -MAX_SAFE_INTEGER
            const updateId = this.$$updateId = uuid++

            const prevState = this.state
            const nextState = typeof updater === 'function' ? updater(prevState) : updater

            if (!nextState) return []

            this.state = assign({}, prevState, Object(nextState))
            return Promise.all(this.$$components.slice().reverse().map(c => c.onUpdate(updateId))).then()
        })
    }

    public $$subscribe (component: SubscribeWrapper) {
        this.$$components.push(component)
    }

    public $$unsubscribe (component: SubscribeWrapper) {
        this.$$components = this.$$components.filter(c => c !== component)
    }

    public on (render: Render<State>): BoxElement<State>
    public on (selector: Selector<State,any,any>, render: Render<State>): BoxElement<State>
    public on (selector: Selector<State,any,any> | Render<State>, render?: Render<State>) {
        if (!render) {
            render = selector as Render<State>
            selector = passThrough
        }

        if (!this.$$Box) this.$$Box = subscribe<BoxProps<State>>(this)(Box)
        return React.createElement(this.$$Box, { __selector__: selector, render })
    }
}

const Box = <S>({ state, render }: {state: S, render: Render<S>}) => render(state)
const passThrough = (v: any) => v

export function subscribe <Props,RState = any> (
    containers: Container<any> | Array<Container<any>>,
    selector: Selector<any,Props,RState> = passThrough
) {
    return makeDecorator(([] as Array<Container<any>>).concat(containers), selector)
}

export function subscribeOnly <Props,RState = any> (
    containers: Container<any> | Array<Container<any>>,
    selector: Selector<any,Props,RState> = passThrough
) {
    return makeDecorator(([] as Array<Container<any>>).concat(containers), selector, true)
}

function makeDecorator<Props,RState> (
    containers: Array<Container<any>>,
    selector: Selector<any,Props,RState> = passThrough,
    isPure: boolean = false
) {
    const Component = isPure ? React.PureComponent : React.Component

    return (Wrapped: React.ComponentType<Props & {state: RState}>): React.ComponentClass<Props> => {
        class SubscribeWrap extends Component<Props> {
            private _updateIds: number[] = Array(containers.length)
            private _state: RState = this.getState()
            private _unmounted = false

            public getState () {
                const states = containers.length === 1 ? containers[0].state : containers.map(c => c.state)
                return ((this.props as WithSelector<Props,RState>).__selector__ || selector)(states, this.props)
            }

            public componentDidMount () {
                containers.forEach(container => container.$$subscribe(this))
            }

            public componentWillUnmount () {
                this._unmounted = true
                containers.forEach(container => container.$$unsubscribe(this))
            }

            public componentDidUpdate () {
                this._updateIds = containers.map(container => container.$$updateId as number)
            }

            public onUpdate (updateId: number) {
                return new Promise<void>(resolve => {
                    if (this._unmounted || includes(this._updateIds, updateId)) return resolve()

                    const nextState = this.getState()
                    if (equal(nextState, this._state)) return resolve()

                    this._state = nextState
                    this.forceUpdate(resolve)
                })
            }

            public render () {
                return React.createElement(Wrapped, assign({}, this.props, { state: this._state }))
            }
        }

        return SubscribeWrap
    }
}
