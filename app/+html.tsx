import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// This file customizes the root HTML for every web page during static
// export. It only runs for the web build (Expo Router web), not for the
// native iOS/Android app.
//
// The default Expo template ships a viewport tag that doesn't disable
// pinch-zoom or reserve room for iOS/Android system bars, which is the
// main reason a chat UI like this one feels cramped or scrolls oddly on
// phone browsers. `viewport-fit=cover` + the safe-area CSS below fixes it.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0E0F10" />
        {/* Keeps the native RN scrollbars/overscroll behavior consistent on web */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveStyle = `
  html, body, #root {
    height: 100%;
    overscroll-behavior-y: none;
  }
  body {
    margin: 0;
    padding: 0;
    background-color: #0E0F10;
  }
  /* Respect the notch / home-indicator / rounded corners on phones */
  :root {
    --safe-area-top: env(safe-area-inset-top, 0px);
    --safe-area-bottom: env(safe-area-inset-bottom, 0px);
    --safe-area-left: env(safe-area-inset-left, 0px);
    --safe-area-right: env(safe-area-inset-right, 0px);
  }
`;
