import * as React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import StarRating from '../src/components/StarRating';
//hei
// Configure Enzyme to use the correct React adapter
configure({ adapter: new Adapter() });

describe('StarRating Component Tests', () => {
  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks(); // Clears any mock functions
  });

  test('Changes rating on star click', () => {
    // Mock the function that will handle rating changes
    const onRatingChange = jest.fn();
    const initialRating = 3;

    // Mount the StarRating component
    const wrapper = mount(<StarRating rating={initialRating} onRatingChange={onRatingChange} />);

    // Simulate clicking the 4th star (index 3)
    wrapper.find('span').at(3).simulate('click');

    // Check that the rating function has been called with the correct value
    expect(onRatingChange).toHaveBeenCalledWith(4);
  });

  test('Does not change rating when in readOnly mode', () => {
    // Mock the function that will handle rating changes
    const onRatingChange = jest.fn();
    const initialRating = 2;

    // Mount the StarRating component in read-only mode
    const wrapper = mount(
      <StarRating rating={initialRating} onRatingChange={onRatingChange} readOnly={true} />,
    );

    // Simulate clicking the 3rd star (index 2)
    wrapper.find('span').at(2).simulate('click');

    // Verify that the onRatingChange function was not called
    expect(onRatingChange).not.toHaveBeenCalled();
  });
});
