if (typeof window !== 'undefined') {
  const token = localStorage.getItem('bearer_token');

  if (!token) {
    window.location.href = '/login';
  }
}
