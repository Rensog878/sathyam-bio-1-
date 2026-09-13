import Navigation from '../components/home/Navigation';
import Footer from '../components/home/Footer';
import ProductDetail from './ProductDetail';

export default function SingleProduct() {
  return (
    <>
      <Navigation />
      <main className="public-page-shell">
        <ProductDetail />
      </main>
      <Footer />
    </>
  );
}
