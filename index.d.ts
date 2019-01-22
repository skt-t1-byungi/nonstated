export declare class Container<State extends {}>{
    protected readonly state: State
    public setState(updater: Partial<State> | ((prevState: State) => Partial<State> | void)): Promise<void>
    public on(render: (state:State) => React.ReactNode): React.ReactElement<{render: typeof render}>
    public on<Selected>( selector: (state:State) => Selected, render: (state:Selected) => React.ReactNode): React.ReactElement<{render: typeof render}>
}

type Selector<Containers, Result> = (state:
    Containers extends [Container<infer R1>] ? [R1]
    : Containers extends [Container<infer R1>, Container<infer R2>] ? [R1, R2]
    : Containers extends [Container<infer R1>, Container<infer R2>] ? [R1, R2]
    : Containers extends [Container<infer R1>, Container<infer R2>, Container<infer R3>] ? [R1, R2, R3]
    : Containers extends [Container<infer R1>, Container<infer R2>, Container<infer R3>, Container<infer R4>] ? [R1, R2, R3, R4]
    : Containers extends [Container<infer R1>, Container<infer R2>, Container<infer R3>, Container<infer R4> , Container<infer R5>] ? [R1, R2, R3, R4, R5]
    : Containers extends Array<Container<any>> ? any
    : Containers extends Container<infer R> ? R : any) => Result

type ContainerTuple = [] | Array<Container<any>>

export declare function subscribe<Props, State, Containers extends Container<any> | ContainerTuple>(
    containers: Containers, selector?: Selector<Containers, State>
): React.Component<Props & {state: State}>

export declare function subscribeOnly<Props, State, Containers extends Container<any> | ContainerTuple>(
    containers: Containers, selector?: Selector<Containers, State>
): React.PureComponent<Props & {state: State}>
