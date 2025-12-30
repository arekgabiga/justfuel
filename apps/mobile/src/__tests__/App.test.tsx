
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

describe('App', () => {
  it('renders correctly', async () => {
    // Wait for the async useEffect in App.tsx (DB init, data fetching) to complete
    const { toJSON, findByText } = render(<App />);
    
    // Wait for the main screen content to appear. 
    // This handles the async transition from "Initializing..." to "CarListScreen"
    // and helps avoid "act(...)" warnings by ensuring the component has settled enough to show content.
    await findByText('Brak samochodów');
    
    expect(toJSON()).toBeDefined();
  });
});

