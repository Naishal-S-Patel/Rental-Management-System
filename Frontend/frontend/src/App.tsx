import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'

// Auth pages
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OAuth2RedirectPage } from '@/pages/OAuth2RedirectPage'

// Customer pages
import { ProductsPage } from '@/pages/ProductsPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CustomerOrdersPage } from '@/pages/CustomerOrdersPage'
import { CustomerOrderDetailPage } from '@/pages/CustomerOrderDetailPage'
import { HomePage } from '@/pages/HomePage'
import { AccountPage } from '@/pages/AccountPage'

// Admin pages
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminOrdersPage } from '@/pages/AdminOrdersPage'
import { AdminOrderDetailPage } from '@/pages/AdminOrderDetailPage'
import { AdminProductsPage } from '@/pages/AdminProductsPage'
import { AdminProductFormPage } from '@/pages/AdminProductFormPage'
import { AdminAttributesPage } from '@/pages/AdminAttributesPage'
import { AdminPricelistPage } from '@/pages/AdminPricelistPage'
import { AdminRentalPeriodsPage } from '@/pages/AdminRentalPeriodsPage'
import { AdminQuotationsPage } from '@/pages/AdminQuotationsPage'
import { AdminSchedulePage } from '@/pages/AdminSchedulePage'
import { AdminSettingsPage } from '@/pages/AdminSettingsPage'

// 404
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: 0,
            border: '1px solid #e2e4e9',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.8125rem',
          },
        }}
      />
      <Routes>
        {/* Public — unauthenticated */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />

        {/* Customer routes (AppShell handles auth + role guard) */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<CustomerOrdersPage />} />
        <Route path="/orders/:id" element={<CustomerOrderDetailPage />} />
        <Route path="/account" element={<AccountPage />} />

        {/* Admin routes (AppShell handles auth + role guard) */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="/admin/attributes" element={<AdminAttributesPage />} />
        <Route path="/admin/pricelists" element={<AdminPricelistPage />} />
        <Route path="/admin/rental-periods" element={<AdminRentalPeriodsPage />} />
        <Route path="/admin/quotations" element={<AdminQuotationsPage />} />
        <Route path="/admin/schedule" element={<AdminSchedulePage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
