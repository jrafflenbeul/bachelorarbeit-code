import "../styles/globals.css";
import "../node_modules/antd/dist/antd.compact.css";
import "../node_modules/bootstrap/dist/css/bootstrap-grid.min.css";
import MenuBar from "../components/MenuBar";
import { Container } from "react-bootstrap";
import {
  PieChartOutlined,
  FundViewOutlined,
} from "@ant-design/icons";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <MenuBar
        menuItems={[
          {
            name: "ETS Auswertung",
            icon: <PieChartOutlined />,
            href: "/",
          },
          {
            name: "Price Performance Ratio",
            icon: <PieChartOutlined />,
            href: "/price-performance-ratio",
          },
          {
            name: "Titel Optimierung",
            icon: <FundViewOutlined />,
            href: "/optimization/title",
          },
        ]}
      />
      <Container className="horizontal-alignment-padding">
        <Component {...pageProps} />
      </Container>
    </>
  );
}

export default MyApp;
