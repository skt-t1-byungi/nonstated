export declare class Container<State extends {}>{
    protected readonly state: State
    public setState(updater: Partial<State> | ((prevState: State) => Partial<State> | void)): Promise<void>
    public on(render: (state:State) => React.ReactNode): React.ReactElement<{render: typeof render}>
    public on<Selected>(
        selector: (state:State) => Selected,
        render: (state:Selected) => React.ReactNode
    ): React.ReactElement<{render: typeof render}>
}

type Selector<Containers, Result> = (
    state: Containers extends Array<Container<infer R>> ? R
        : Containers extends Container<infer R> ? R
            : any) => Result

export declare function subscribe<Props, State, Containers extends Container<any> | Array<Container<any>>>(
    containers: Containers,
    selector?: Selector<Containers, State>
): React.Component<Props & {state: State}>

export declare function subscribeOnly<Props, State, Containers extends Container<any> | Array<Container<any>>>(
    containers: Containers,
    selector?: Selector<Containers, State>
): React.PureComponent<Props & {state: State}>
