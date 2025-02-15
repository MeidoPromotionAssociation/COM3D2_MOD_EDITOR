// src/components/RouterContainer.tsx
import {HashRouter} from "react-router-dom";
import App from "./App";

const RouterContainer = () => {
    return (
        <HashRouter basename={"/"}>
            <App/>
        </HashRouter>
    );
};

export default RouterContainer;