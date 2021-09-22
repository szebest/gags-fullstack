import hasAccessReducer from "./hasAccess"
import { combineReducers } from "redux"

const allReducers = combineReducers({
    hasAccess: hasAccessReducer
})

export default allReducers