module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/axelar',
        permanent: true,
      },
    ]
  },
}