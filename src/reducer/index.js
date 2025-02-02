import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import profileReducer from "../slices/profileSlice";
import cartReducer from "../slices/CartSlice"
import courseReducer from "../slices/CourseSlice"
import viewCourseReducer from "../slices/viewCourseSlice"
import LoadingBarReducer from "../slices/loadingBarSlice"
import categoryReducer from "../slices/categorySlice"

const rootReducer = combineReducers({
    auth: authReducer,
    profile: profileReducer,
    cart: cartReducer,
    course : courseReducer,
    viewCourse: viewCourseReducer,
    loadingBar: LoadingBarReducer,
    category: categoryReducer
})

export default rootReducer;