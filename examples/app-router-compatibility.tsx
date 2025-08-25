/**
 * App Router Compatibility Example
 * 
 * This example demonstrates how to use the FluidBackground component
 * with Next.js App Router, including proper client-side rendering
 * and layout integration.
 */

'use client'; // Required for client-side components in App Router

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FluidBackground to ensure client-side only rendering
const FluidBackground = dynamic(() => import('fluid-background'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      zIndex: -1
    }}>
      {/* Fallback gradient background while loading */}
    </div>
  )
});

// Example layout component for App Router
export function AppRouterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Fluid background with App Router optimized settings */}
      <Suspense fallback={
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          zIndex: -1
        }} />
      }>
        <FluidBackground
          colors={{
            background: { r: 0.12, g: 0.24, b: 0.45 },
            fluid: 'rainbow'
          }}
          performance={{
            resolution: 'auto',
            frameRate: 60,
            pauseOnHidden: true
          }}
          interaction={{
            enabled: true,
            mouse: true,
            touch: true,
            intensity: 1.0
          }}
          style={{
            zIndex: -1
          }}
        />
      </Suspense>
      
      {/* Page content */}
      <main style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}

// Example page component using the layout
export default function AppRouterPage() {
  return (
    <AppRouterLayout>
      <div style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          marginTop: '4rem'
        }}>
          <h1>Next.js App Router Integration</h1>
          <p>
            This example demonstrates how to properly integrate the FluidBackground
            component with Next.js App Router architecture.
          </p>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Key Features</h2>
            <ul>
              <li><strong>Client-side Only:</strong> Uses 'use client' directive</li>
              <li><strong>Dynamic Import:</strong> Prevents SSR hydration issues</li>
              <li><strong>Suspense Boundary:</strong> Graceful loading states</li>
              <li><strong>Fallback Background:</strong> Static gradient while loading</li>
              <li><strong>Layout Integration:</strong> Reusable layout component</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>App Router Best Practices</h2>
            <ul>
              <li>Always use 'use client' for interactive components</li>
              <li>Implement proper loading states with Suspense</li>
              <li>Use dynamic imports for client-only libraries</li>
              <li>Provide fallback content for better UX</li>
              <li>Consider performance implications of client components</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Usage in app/layout.tsx</h2>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
{`import { AppRouterLayout } from './components/AppRouterLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterLayout>
          {children}
        </AppRouterLayout>
      </body>
    </html>
  );
}`}
            </pre>
          </div>
        </div>
      </div>
    </AppRouterLayout>
  );
}