export declare const localStorageService: {
    getDeviceUuid: () => string | null;
    setDeviceUuid: (uuid: string) => void;
    getAccessToken: () => string | null;
    setAccessToken: (token: string) => void;
    clearAuthData: () => void;
};
export default localStorageService;
