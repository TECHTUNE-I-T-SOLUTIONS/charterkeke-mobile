import { router } from 'expo-router';

let navigationRef: typeof router | null = null;

export const setNavigationRef = (ref: typeof router) => {
  navigationRef = ref;
};

export const getNavigationRef = (): typeof router | null => {
  return navigationRef;
};

export const navigate = (routeName: string, params?: any) => {
  if (navigationRef) {
    if (!params && routeName.includes('?')) {
      navigationRef.push(routeName as any);
      return;
    }
    navigationRef.push({
      pathname: routeName,
      params,
    });
  } else {
    console.warn('Navigation ref not set');
  }
};

export const replaceNavigate = (routeName: string, params?: any) => {
  if (navigationRef) {
    navigationRef.replace({
      pathname: routeName,
      params,
    });
  } else {
    console.warn('Navigation ref not set');
  }
};

export const goBack = () => {
  if (navigationRef) {
    navigationRef.back();
  }
};
