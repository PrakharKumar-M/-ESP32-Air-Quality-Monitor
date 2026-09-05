import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <>
      <Navbar />

      <div className="d-flex">

        <Sidebar />

        <main
          className="flex-grow-1 p-4"
          style={{
            background: "#F5F7FC",
            minHeight: "100vh",
          }}
        >
          {children}

          <Footer />
        </main>

      </div>
    </>
  );
}

export default Layout;