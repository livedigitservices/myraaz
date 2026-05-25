import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar              from './components/Navbar';
import Footer              from './components/Footer';
import PrivateRoute        from './components/PrivateRoute';
import AdminRoute          from './components/AdminRoute';
import MobileBottomNav     from './components/MobileBottomNav';
import AdminMobileBottomNav from './components/AdminMobileBottomNav';

import Home          from './pages/Home';
import ProductsList  from './pages/ProductsList';
import ProductDetail from './pages/ProductDetail';
import Cart          from './pages/Cart';
import Checkout      from './pages/Checkout';
import Wishlist      from './pages/Wishlist';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import UserDashboard from './pages/user/UserDashboard';
import OrderHistory  from './pages/user/OrderHistory';
import EditProfile   from './pages/user/EditProfile';
import Wallet        from './pages/user/Wallet';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts  from './pages/admin/AdminProducts';
import AddProduct     from './pages/admin/AddProduct';
import EditProduct    from './pages/admin/EditProduct';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminCoupons   from './pages/admin/AdminCoupons';
import AdminReturns   from './pages/admin/AdminReturns';
import AdminHomeMedia from './pages/admin/AdminHomeMedia';
import AboutPage        from './pages/AboutPage';
import ContactPage      from './pages/ContactPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import ReturnsPage      from './pages/ReturnsPage';
import FaqPage          from './pages/FaqPage';

/* Pages where the USER mobile nav should NOT appear */
const HIDE_USER_NAV = ['/', '/login', '/register', '/forgot-password', '/checkout'];

function AppLayout() {
  const { pathname } = useLocation();

  const isAdminPage = pathname.startsWith('/admin');

  const hideUserNav =
    isAdminPage ||
    HIDE_USER_NAV.includes(pathname) ||
    pathname.startsWith('/products');   // /products and /products/:id

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/products"     element={<ProductsList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/cart"     element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />

          <Route path="/dashboard"          element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          <Route path="/dashboard/orders"   element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
          <Route path="/dashboard/profile"  element={<PrivateRoute><EditProfile /></PrivateRoute>} />
          <Route path="/dashboard/wallet"   element={<PrivateRoute><Wallet /></PrivateRoute>} />

          <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products"           element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/add"       element={<AdminRoute><AddProduct /></AdminRoute>} />
          <Route path="/admin/products/edit/:id"  element={<AdminRoute><EditProduct /></AdminRoute>} />
          <Route path="/admin/orders"             element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users"              element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/coupons"            element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/returns"            element={<AdminRoute><AdminReturns /></AdminRoute>} />
          <Route path="/admin/home-media"         element={<AdminHomeMedia />} />

          <Route path="/about"           element={<AboutPage />} />
          <Route path="/contact"         element={<ContactPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/returns"         element={<ReturnsPage />} />
          <Route path="/faq"             element={<FaqPage />} />
        </Routes>
      </main>
      <Footer />

      {/* User mobile nav — dashboard, cart, wishlist routes */}
      {!hideUserNav && <MobileBottomNav />}

      {/* Admin mobile nav — all /admin/* routes */}
      {isAdminPage && <AdminMobileBottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}