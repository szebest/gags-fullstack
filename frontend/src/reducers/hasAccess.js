const inititalState = false

const hasAccessReducer = (state = inititalState, action) => {
    switch (action.type) {
        case 'SET': return action.payload
        default: return state
    }
}

export default hasAccessReducer