import * as React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import StarRating from '../src/components/StarRating';

configure({ adapter: new Adapter() });

describe('Tester for StarRating-komponenten', () => {
  afterEach(() => {
    // Rydder opp mock-funksjoner etter hver test
    jest.clearAllMocks();
  });

  test('Endrer rating når en stjerne klikkes', () => {
    const onRatingChange = jest.fn(); // Mock-funksjon for å håndtere ratingendringer
    const initialRating = 3;

    const wrapper = mount(<StarRating rating={initialRating} onRatingChange={onRatingChange} />);

    wrapper.find('span').at(3).simulate('click'); // Simulerer klikk på 4. stjerne

    expect(onRatingChange).toHaveBeenCalledWith(4); // Sjekker at riktig verdi sendes
  });

  test('Endrer ikke rating i readOnly-modus', () => {
    const onRatingChange = jest.fn();
    const initialRating = 2;

    const wrapper = mount(
      <StarRating rating={initialRating} onRatingChange={onRatingChange} readOnly={true} />,
    );

    wrapper.find('span').at(2).simulate('click'); // Simulerer klikk på 3. stjerne

    expect(onRatingChange).not.toHaveBeenCalled(); // Sjekker at funksjonen ikke kalles
  });
});
