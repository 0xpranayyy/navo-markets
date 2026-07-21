import React from 'react';
import { darkColors } from '../theme/palettes';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const C = darkColors;
      return (
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, background: C.bgDeep, color: C.text }}>
          <div style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginBottom: 20 }}>
              {this.state.error.message || 'An unexpected error occurred.'}
            </div>
            <div className="pressable" onClick={() => window.location.reload()}
              style={{ display: 'inline-block', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 12, padding: '12px 24px' }}>
              Reload app
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
