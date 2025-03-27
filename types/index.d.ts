import { Component, ReactComponentElement } from "react"

export type MenuItemRoute = {
    name: string
    path: string
    componentFullName: string
    component?: ReactComponentElement
    params?: any
    routes?: MenuItemRoute[]
}

export type Application = {
    code: string
    title: string
    icon?: string
    description?: string
    businessContext?: string
    menus?: MenuItemRoute[]
}



export type RouteComponentProps = {
    routes: MenuItemRoute[]
}