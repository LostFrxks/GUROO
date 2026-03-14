import Header from "../components/Header";
import Footer from "../components/Footer";

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <h1 className="page-title">Page Not Found</h1>
          <p className="muted">The page you are looking for does not exist.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
