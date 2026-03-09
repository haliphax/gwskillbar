export const DEFAULT_BUILD = "OAVTEYDfG6GYCwmsOIm0GEAoqC";

export const LOCALSTORAGE_GLOBAL_PREFIX = "narf.";

const rootUriElement = document.getElementById("rootURI");
export const ROOT_URI = rootUriElement
	? (rootUriElement as HTMLInputElement).value
	: "/";
