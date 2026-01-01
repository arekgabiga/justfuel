export const navigateTo = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};
