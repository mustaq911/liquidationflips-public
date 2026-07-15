const CONFIG = {
  
  /* Production Configuration */
  API_BASE_URL: "https://api.liquidationflips.ca",

  /* Local Configuration */
  // API_BASE_URL: "http://localhost:8080",
  
  
  STRIPE_PUBLIC_KEY: "pk_test_51SB3m1IIchWoEqKqXIfObOksOX98DDZm0LVyhIfO2zvEhrAa92QZWYUs6QdinWMW4uWRuCq7rmdlwOJy5Hk8EDXj006tmSDc3j",
  CANADA_POST_API_KEY: "AA11-AA11-AA11-AA11"
};

// Self-contained "No Image" placeholder (inline SVG data URI). Replaces the old
// via.placeholder.com fallback, which is offline and threw net::ERR_CONNECTION_CLOSED
// for any lot without a photo. This needs no network, so it can never fail.
const NO_IMAGE = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23eef0f2%22%2F%3E%3Cg%20transform%3D%22translate(140%2C140)%20scale(5)%22%20fill%3D%22none%22%20stroke%3D%22%23b8bfc9%22%20stroke-width%3D%221.75%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%2218%22%20height%3D%2218%22%20rx%3D%222%22%20ry%3D%222%22%2F%3E%3Ccircle%20cx%3D%228.5%22%20cy%3D%228.5%22%20r%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M21%2015l-5-5L5%2021%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';
if (typeof window !== 'undefined') window.NO_IMAGE = NO_IMAGE;