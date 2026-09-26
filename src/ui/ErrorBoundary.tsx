import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palettes, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

interface State {
  error: Error | null;
}

/** Last line of defense: a crash in a screen shows a recoverable message instead of a white screen. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text variant="title" align="center">
          Something went wrong
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          The app hit an unexpected problem. Your saved places are safe.
        </Text>
        <Button title="Try again" onPress={() => this.setState({ error: null })} style={styles.button} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.lg,
    backgroundColor: palettes.light.background,
  },
  button: { alignSelf: 'stretch' },
});
