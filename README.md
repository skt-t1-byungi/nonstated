# nonstated
simple react state management library (inspired by unstated)

> ⚠️ Work In Progress

## Install
```
yarn add nonstated
```

## Usage
```jsx
import {Container} from 'nonstated'

class CounterContainer extends Container{
    state = {val: 0}
    increment() {
        this.setState({val: this.state.val + 1})
    }
    decrement() {
        this.setState({val: this.state.val - 1})
    }
}

const counter = new CounterContainer()

class Counter extends React.Component{
    render() {
        return (
            <div>
                <span>{counter.on(s => s.val)}</span>
                <button onClick={() => counter.decrement()}> - </button>
                <button onClick={() => counter.increment()}> + </button>
            </div>)
    }
}
```

## License
MIT
