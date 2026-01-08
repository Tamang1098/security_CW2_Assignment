import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navbar
    welcomeBack: 'Welcome back',
    productPage: 'Product Page',
    myOrders: 'My Orders',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    adminLogin: 'Admin Login',

    // Landing Page
    filterByCategory: 'Filter by Category',
    allCategories: 'All Categories',
    showProducts: 'Show Products',
    allProducts: 'All Products',
    featuredProducts: 'Featured Products',
    noProducts: 'No products available',
    inThisCategory: 'in this category',
    showing: 'Showing',
    of: 'of',
    products: 'products',
    adminCanAdd: 'Admin can add products from the admin panel',

    // Login/Register
    email: 'Email',
    password: 'Password',
    name: 'Name',
    phone: 'Mobile Number',
    confirmPassword: 'Confirm Password',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    enterName: 'Enter your name',
    enterPhone: 'Enter your mobile number',
    enterConfirmPassword: 'Confirm your password',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    switchToRegister: 'Register here',
    switchToLogin: 'Login here',
    createAccount: 'Create Account',
    loggingIn: 'Logging in...',
    registering: 'Registering...',
    passwordsNotMatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 6 characters',
    registrationSuccess: 'Registration successful! Please login to continue.',
    loginSuccess: 'Login successful! Welcome back!',

    // Product
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    viewDetails: 'View Details',
    price: 'Price',
    quantity: 'Quantity',
    total: 'Total',
    originalPrice: 'Original Price',
    stock: 'Stock',
    remaining: 'remaining',
    available: 'available',
    outOfStock: 'Out of Stock',
    processing: 'Processing...',
    productNotFound: 'Product not found',
    loadingProduct: 'Loading product...',

    // Cart
    cart: 'Cart',
    yourCart: 'Your Cart',
    items: 'items',
    emptyCart: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    proceedToCheckout: 'Proceed to Checkout',
    remove: 'Remove',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    loadingCart: 'Loading cart...',
    errorUpdatingCart: 'Error updating cart',
    errorRemovingItem: 'Error removing item',

    // Checkout
    checkout: 'Checkout',
    shippingAddress: 'Shipping Address',
    paymentMethod: 'Payment Method',
    cashOnDelivery: 'Cash on Delivery',
    onlinePayment: 'Online Payment',
    placeOrder: 'Place Order',
    placingOrder: 'Placing Order...',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    address: 'Address',
    city: 'City',
    postalCode: 'Postal Code',
    payWhenReceive: 'Pay when you receive the order',
    payViaQR: 'Pay via QR code',
    orderPlacedSuccess: 'Order placed successfully! Your order will be delivered soon.',
    errorPlacingOrder: 'Error placing order. Please try again.',
    paymentVerificationProgress: 'Payment verification is in progress. Please wait for admin confirmation.',
    paymentSuccessful: 'Payment successful! Your payment has been verified.',
    totalAmount: 'Total Amount',
    scanQRCode: 'Scan the QR code below to pay',
    remarks: 'In Remarks: Please enter your E-mail',
    paymentDone: 'Payment Done',

    // Orders
    orderHistory: 'Order History',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    orderTotal: 'Order Total',
    viewOrder: 'View Order',
    qty: 'Qty',
    noOrdersYet: "You haven't placed any orders yet.",
    shopNow: 'Shop Now',
    orderedItems: 'Ordered Items',
    totalPrice: 'Total Price',
    loadingOrderDetails: 'Loading order details...',
    orderNotFound: 'Order not found',
    backToOrders: 'Back to Orders',
    orderDetails: 'Order Details',
    orderInformation: 'Order Information',
    paymentStatus: 'Payment Status',
    orderItems: 'Order Items',
    each: 'each',
    paymentViaQR: 'Payment via QR Code',
    scanQRCodePayment: 'Scan this QR code with your payment app to complete the payment',
    confirming: 'Confirming...',
    iHavePaid: 'I Have Paid',
    generateQRCode: 'Generate QR Code',
    youWillPayWhenReceive: 'You will pay when you receive the order.',
    amount: 'Amount',
    paymentConfirmed: 'Payment Confirmed',
    paymentConfirmedMessage: 'Your payment has been confirmed. Your order is being processed.',
    haveYouCompletedPayment: 'Have you completed the payment? This will confirm your order.',
    paymentConfirmedAlert: 'Payment confirmed! Your order will be processed.',
    errorConfirmingPayment: 'Error confirming payment',

    // Common
    perPage: 'per page',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    select: 'Select',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    confirm: 'Confirm',
    page: 'Page',
    selectPaymentMethod: 'Select Payment Method',
    cashOnDeliveryCOD: 'Cash on Delivery (COD)'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ne' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

