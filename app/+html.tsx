import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* This helper resets scroll styles for a consistent look */}
        <ScrollViewStyleReset />

        {/* ADD THIS: This is a hack to ensure the background is black before Tailwind loads */}
        <style dangerouslySetInnerHTML={{ __html: `body { background-color: #000000; }` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}