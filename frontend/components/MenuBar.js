import React, { useState } from "react";
import { Menu, Button } from "antd";
import { Container } from "react-bootstrap";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import Link from "next/link";

const MenuBar = ({ menuItems }) => {
  return (
    <div
      className="ant-menu ant-menu-dark"
      style={{ width: "100%", boxShadow: "none" }}
    >
      <Container>
        <Menu defaultSelectedKeys={["0"]} mode="horizontal" theme="dark">
          {menuItems.map((menuItem, i) => (
            <Menu.Item key={String(i)} icon={menuItem.icon}>
              <Link href={menuItem.href}>
                <a>{menuItem.name}</a>
              </Link>
            </Menu.Item>
          ))}
        </Menu>
      </Container>
    </div>
  );
};

export default MenuBar;
