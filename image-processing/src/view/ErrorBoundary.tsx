import React from "react";


export default class ErrorBoundary extends React.Component<any, {error: Error | undefined}> {
    constructor(props: any) {
      super(props);
      this.state = { error: undefined };
    }

    static getDerivedStateFromError(error: Error) {
      // Update state so the next render will show the fallback UI.
      return { error };
    }

    componentDidCatch(error: Error, errorInfo: any) {

    }

    render() {
        if (this.state.error) {
          // You can render any custom fallback UI
          return <h1>Something went wrong: {this.state.error.message}</h1>;
        }

        return this.props.children;
    }
  }