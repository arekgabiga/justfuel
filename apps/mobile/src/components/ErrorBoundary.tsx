import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Separate component to use hooks (useTheme)
const ErrorFallback = ({ error, onRetry }: { error: Error | null; onRetry: () => void }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={{ color: theme.colors.error }}>Oops, something went wrong</Title>
          <Paragraph style={styles.paragraph}>
            The application encountered an unexpected error.
          </Paragraph>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {error.toString()}
              </Text>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={onRetry} style={styles.button}>
            Try Again
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  paragraph: {
    marginVertical: 10,
  },
  errorBox: {
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
});

export default ErrorBoundary;
