import { Router } from 'expo-router';

let navigationRef: Router | null = null;

export const setNavigationRef = (ref: Router) => {
  navigationRef = ref;
};

export const getNavigationRef = (): Router | null => {
  return navigationRef;
};

export const navigate = (routeName: string, params?: any) => {
  if (navigationRef) {
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
