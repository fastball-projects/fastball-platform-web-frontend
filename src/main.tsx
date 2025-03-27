import {
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from "@ant-design/icons";
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Outlet, Link, Navigate, RouteProps, useLocation } from "react-router-dom";
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
import type { MenuProps } from "antd";
import { Spin, Button, Result, Dropdown, message, Modal, Drawer } from 'antd';

// import { FastballContextProvider } from 'fastball-frontend-common';

import routes from './routes'
import { Application, MenuItemRoute, RouteComponentProps } from '../types'
import { routeBuilder } from './route-builder'
import Login from './login'
import ChangePasswordForm from './change-password'
import { MessageIcon, MessageList } from './message'
import { BusinessContextSelector } from './business-context'
import { buildJsonRequestInfo } from './utils'
import config from '../config.json'

import './main.scss'

const TOKEN_LOCAL_KEY = 'fastball_token';

// 临时写一下吧, 回头整体 protal 改一下
const getCurrentUserInfo = async (setCurrentUser: Function) => {
  const request = buildJsonRequestInfo()
  const resp = await fetch('/api/portal/web/currentUser', request)
  const json = await resp.text();
  if (json) {
    const result = JSON.parse(json);
    if (result.status === 200) {
      setCurrentUser(result.data)
      return;
    }
    if (result.status === 401) {
      location.href = '/#/login?redirectUrl=' + location.href
    } else {
      message.error(`Error ${result.status}: ${result.message}`);
    }
  }
}

const filterAuthorizedMenus = (route: MenuItemRoute, menuKeyMap: { [key: string]: boolean }, currentApplication?: string): MenuItemRoute | undefined => {
  if (!route.path.startsWith('/' + currentApplication)) {
    return;
  }
  const newRoute: MenuItemRoute = { ...route }
  if (route.routes) {
    newRoute.routes = route.routes.map(route => filterAuthorizedMenus(route, menuKeyMap, currentApplication)).filter(Boolean)
  }
  if (menuKeyMap[newRoute.path] || (newRoute.routes && newRoute.routes.length > 0)) {
    return newRoute;
  }
}

export const menuRouteBuilder = (menu: MenuItemRoute) => {
  const routes = menu.routes ? menu.routes.map(m => menuRouteBuilder(m)) : []
  const routeProps: RouteProps = { path: menu.path }
  if (menu.component) {
    const MenuItemComponent = menu.component
    routeProps.element = (
//       <PageContainer fixedHeader breadcrumbRender={false}>
        <div className="fastball-web-container">
            <MenuItemComponent input={menu.params} />
        </div>
//       </PageContainer>
    )
  }
  return (
    <Route key={menu.path} {...routeProps}>
      {routes}
    </Route>
  )
}

export const applicationRouteBuilder = (app: Application, currentUser: any, routes?: MenuItemRoute[], currentApplication?: string) => {
  return (
    <Route path={"/" + app.code}>
    </Route>
  )
}

const HomePage: React.FC<RouteComponentProps> = ({ routes }) => {
  const [currentUser, setCurrentUser] = useState();
  const { pathname } = useLocation();

  React.useEffect(() => {
    if (pathname !== '/login') {
      getCurrentUserInfo(setCurrentUser);
    }
  }, [])

  const applicationCode = pathname.split('/')[1]
  const menuRoutes = routes?.map(m => menuRouteBuilder(m)) || []
  const authedMenus: { [key: string]: boolean } = {};
  const applications = currentUser?.applications?.map((app: Application) => app.menus?.forEach(({ path }) => authedMenus['/' + app.code + path] = true))
  const authorizedRoutes = routes?.map(route => filterAuthorizedMenus(route, authedMenus, applicationCode)).filter(Boolean) || []
  // let authorizedRoutes = []
  // if (currentUser?.applications) {
  //   const applicationCode = location.pathname.split('/')[1]
  //   currentUser.applications.forEach(app => {
  //     const menuKeyMap = {};
  //     app.menus?.forEach(({ path }) => menuKeyMap['/' + app.code + path] = true)
  //     if (applicationCode === app.code) {
  //       app.currentApplication = true
  //     }
  //     applications.push(app)
  //   });
  //   authorizedRoutes = routes.map(route => filterAuthorizedMenus(route, menuKeyMap)).filter(Boolean);;
  // }
 const indexRoute = authorizedRoutes[0]?.component ? <Route index element={<Navigate to={authorizedRoutes[0].path} replace />} /> : null
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout routes={authorizedRoutes} currentUser={currentUser} />}>
        {indexRoute}
        {menuRoutes}
        <Route path="*" element={<Page404 />} />
      </Route>
    </Routes>
  )
}


const Page404 = () => (
  <Result
    status="404"
    style={{
      height: '100%',
    }}
    title="Hello World"
    subTitle="Sorry, you are not authorized to access this page."
    extra={<Button type="primary">Back Home</Button>}
  />
)



const Layout: React.FC<RouteComponentProps> = ({ routes, currentUser }) => {
  const { pathname: locationPathname } = useLocation();
  const [pathname, setPathname] = useState(locationPathname);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changeMessageModalOpen, setChangeMessageModalOpen] = useState(false);

  const userMenu: MenuProps["items"] = [
    {
      key: "profiler",
      icon: <UserOutlined />,
      label: "修改密码",
      onClick: () => {
        setChangePasswordModalOpen(true)
      }
    },
    {
      type: "divider"
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: () => {
        localStorage.removeItem(TOKEN_LOCAL_KEY)
        location.href = '/#/login?redirectUrl=' + location.href
      }
    }
  ];

  const appList = currentUser?.applications?.map(app => ({
    icon: app.icon,
    title: app.title,
    desc: app.description,
    url: '/#/' + app.code
  })) || []


  //   let currentBusinessContext = null;
  //
  //     currentBusinessContext = app.businessContext

  return (
    <div
      id="test-pro-layout"
      style={{
        height: '100vh',
      }}
    >
      <ProLayout
        fixSiderbar
        fixedHeader
        iconfontUrl={config.menuIconfontUrl}
        collapsedButtonRender={false}
//         splitMenus
//         menuHeaderRender={(p)=>console.log(p)}
        layout="mix"
        headerContentRender={(p) =>{
            const components = []
            const applicationCode = pathname.split('/')[1]
            const application = currentUser?.applications?.find((app: Application) => app.code === applicationCode)
            if (application?.businessContext) {
                components.push(<BusinessContextSelector businessContextKey={application.businessContext} />)
            }
            return components;
        }}
        title={config.title}
        logo={config.logo}
        token={{
          bgLayout: '#fff',
          header: {
            colorBgHeader: '#fff',
          },
          sider: {
            colorMenuBackground: '#fff',
            colorTextMenuSelected: '#1677ff',
            colorBgMenuItemSelected: '#e6f4ff',
          },
          pageContainer: {
            colorBgPageContainer: '#fff',
          },
        }}
        route={{
          path: '/',
          routes,
        }}
        location={{
          pathname,
        }}
        // waterMarkProps={{
        //   content: currentUser?.username,
        // }}
        avatarProps={{
          // src: currentUser?.avatar,
          // icon: currentUser?.avatar ? null : <UserOutlined />,
          icon: <UserOutlined />,
          render: (avatarProps, dom) => <Dropdown menu={{ items: userMenu }}>{dom}</Dropdown>,
          size: 'small',
          title: currentUser?.nickname || '用户',
        }}

        actionsRender={() => {
          const actions = [];
          if (config.enableNotice) {
            actions.push(<MessageIcon onClick={() => setChangeMessageModalOpen(true)}/>)
          }
          return actions;
        }}
        menu={{ defaultOpenAll: true }}
        menuItemRender={(item, dom) => (
          <Link onClick={() => setPathname(item.path || '/welcome')} to={item.path}>{dom}</Link>
        )}
        appList={appList}>
        <Outlet />
      </ProLayout>
      <Modal title="修改密码" open={changePasswordModalOpen} onCancel={() => setChangePasswordModalOpen(false)} footer={null}>
        <ChangePasswordForm />
      </Modal>
      <Drawer width="75%" title="修改密码" open={changeMessageModalOpen} onClose={() => setChangeMessageModalOpen(false)} >
        <MessageList />
      </Drawer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <HashRouter>
      <HomePage routes={routes} />
  </HashRouter>
)
