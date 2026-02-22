import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND, COLORS } from '@/utils/colors';

const ERROR_LOG_KEY = '@charter_keke_error_log';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const payload = {
      message: error?.message || 'Unknown render error',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      timestamp: new Date().toISOString(),
    };

    try {
      const previous = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const parsed = previous ? JSON.parse(previous) : [];
      const next = [payload, ...parsed].slice(0, 20);
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(next));
    } catch (storageError) {
      console.log('Failed to cache app error:', storageError);
    }

    Alert.alert('Something went wrong', 'An error was caught and logged. Tap Continue to keep using the app.');
  }

  private handleContinue = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>The error has been logged locally.</Text>
        <TouchableOpacity onPress={this.handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.dark.background,
  },
  title: {
    color: COLORS.dark.text,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.dark.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: BRAND.black,
    fontWeight: '700',
  },
});
