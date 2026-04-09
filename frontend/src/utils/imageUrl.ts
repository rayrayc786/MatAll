export const getFullImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
  if (url.startsWith('http')) return url;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // If the URL doesn't start with a known directory prefix, assume it's in /images/
  let processedUrl = url;
  if (!url.startsWith('/images/') && !url.startsWith('/uploads/')) {
    processedUrl = url.startsWith('/') ? `/images${url}` : `/images/${url}`;
  } else {
    processedUrl = url.startsWith('/') ? url : `/${url}`;
  }

  return encodeURI(`${cleanBase}${processedUrl}`);
};
