import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import Modal from 'react-modal';
import axios from 'axios';
import fetchMock from 'jest-fetch-mock';

// Mock Axios
jest.mock('axios', () => {
  const mockAxios = {
    defaults: {
      baseURL: '',
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return mockAxios;
});

// Set up Axios default base URL
axios.defaults.baseURL = 'http://localhost:3001/api'; // Set a test base URL

// Enable fetch mock
fetchMock.enableMocks();

// Set up React Modal
const root = document.createElement('div');
root.setAttribute('id', 'root');
document.body.appendChild(root);
Modal.setAppElement('#root');

// Configure Enzyme
configure({ adapter: new Adapter() });
