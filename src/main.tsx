import React from 'react';
import { createRoot } from 'react-dom/client';
import Demo from './demo';

const root = createRoot(document.getElementById('root')!);
root.render(<Demo />);
