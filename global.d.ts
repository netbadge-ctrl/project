declare global {
  interface Window {
    completeOIDCLogin?: (userInfo: any, token: string) => void;
  }
}

export {};