const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
});
module.exports = withPWA({
  reactStrictMode: true,
  // Increase API body size limit to handle large image uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set to 10MB or adjust as needed
    },
  },
});