import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import './utils/i18n';
import RouterContainer from "./RouterContainer";

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <RouterContainer/>
    </React.StrictMode>
)
