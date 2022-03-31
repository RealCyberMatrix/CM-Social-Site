import * as React from 'react'
import { Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

interface RequireWalletConnectionProps extends React.PropsWithChildren<{}>{
    children: JSX.Element,
}

// temporay fix: https://github.com/reach/router/issues/414
interface LocationState { from: { pathname: string } }

export default function RequireWalletConnection(props: RequireWalletConnectionProps) {
    const { children} = props
    const isConnected = true
 
    return isConnected ? children : <Navigate to={import.meta.env.BASE_URL + "login"} replace />
}