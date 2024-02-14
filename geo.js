export function countryInfo() {
    const scriptUrl = new URL(import.meta.url);
    const params = new URLSearchParams(scriptUrl.searchParams);
    return params.get('country');
};