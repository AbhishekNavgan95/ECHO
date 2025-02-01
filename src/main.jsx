import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducer";
import { Toaster } from "react-hot-toast"
import SmoothScroll from "./components/common/SmoothScroll.jsx";

const store = configureStore({
  reducer: rootReducer,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      {/* <SmoothScroll> */}
        <App />
        <Toaster />
      {/* </SmoothScroll> */}
    </BrowserRouter>
  </Provider>
);


// left on course information form .jsx