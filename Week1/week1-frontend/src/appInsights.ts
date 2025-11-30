import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();

// Application Insights connection string
const connectionString = process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING ||
  'InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;LiveEndpoint=https://southeastasia.livediagnostics.monitor.azure.com/;ApplicationId=95976a35-6e1c-4dff-bc84-3b4cbcc8b360';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    enableAutoRouteTracking: true,
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory }
    }
  }
});

appInsights.loadAppInsights();

// Track page views automatically
appInsights.trackPageView();

export { reactPlugin, appInsights };
