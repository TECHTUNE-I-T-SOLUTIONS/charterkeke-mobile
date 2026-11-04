import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRAND, COLORS } from '@/utils/colors';
import { reportAppError } from '@/services/experienceReporting';

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
    const enrichedError = new Error(`${error?.message || 'Unknown render error'}\n${errorInfo?.componentStack || ''}`);
    enrichedError.name = error?.name || 'RenderError';
    enrichedError.stack = error?.stack || enrichedError.stack;
    void reportAppError(enrichedError, 'app', 'react_render_error');
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
        <Text style={styles.subtitle}>Return to the app and try again.</Text>
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
