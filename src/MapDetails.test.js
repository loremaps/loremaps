import React from 'react';
import ReactDOM from 'react-dom';
import MapDetails from './MapDetails';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<MapDetails />, div);
    ReactDOM.unmountComponentAtNode(div);
});
