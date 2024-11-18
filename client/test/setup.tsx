import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import Modal from 'react-modal';

import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

// Other setup code (if any)
Modal.setAppElement(document.createElement('div'));

configure({ adapter: new Adapter() });
