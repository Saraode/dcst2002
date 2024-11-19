import * as React from 'react';
import { shallow } from 'enzyme';
import { Card, Row, Column, Form, Button, Alert } from '../src/components/widgets';

describe('Tester for widgets-komponenter', () => {
  describe('Card-komponenten', () => {
    test('rendrer med tittel og innhold', () => {
      const wrapper = shallow(<Card title="Test Tittel">Kortinnhold</Card>);
      expect(wrapper.containsMatchingElement(<h2>Test Tittel</h2>)).toBe(true);
      expect(wrapper.containsMatchingElement(<div>Kortinnhold</div>)).toBe(true);
    });

    test('rendrer uten krasj når tittel mangler', () => {
      const wrapper = shallow(<Card title="">Kortinnhold</Card>);
      expect(wrapper.containsMatchingElement(<div>Kortinnhold</div>)).toBe(true);
    });
  });

  describe('Row-komponenten', () => {
    test('rendrer barn i en fleks-beholder', () => {
      const wrapper = shallow(
        <Row>
          <div>Barn 1</div>
          <div>Barn 2</div>
        </Row>,
      );
      expect(wrapper.containsMatchingElement(<div>Barn 1</div>)).toBe(true);
      expect(wrapper.containsMatchingElement(<div>Barn 2</div>)).toBe(true);
    });
  });

  describe('Column-komponenten', () => {
    test('rendrer med standard bredde', () => {
      const wrapper = shallow(
        <Column>
          <div>Innhold</div>
        </Column>,
      );
      expect(wrapper.containsMatchingElement(<div>Innhold</div>)).toBe(true);
    });

    test('rendrer med tilpasset bredde', () => {
      const wrapper = shallow(
        <Column width={5}>
          <div>Innhold</div>
        </Column>,
      );
      expect(wrapper.prop('style')).toHaveProperty('flex', '0 0 50%');
    });
  });

  describe('Form-komponenter', () => {
    test('Form.Label rendrer riktig', () => {
      const wrapper = shallow(<Form.Label>Testetikett</Form.Label>);
      expect(wrapper.containsMatchingElement(<label>Testetikett</label>)).toBe(true);
    });

    test('Form.Input håndterer endringshendelser', () => {
      let verdi = '';
      const wrapper = shallow(
        <Form.Input
          type="text"
          value={verdi}
          onChange={(e) => {
            verdi = e.target.value;
          }}
        />,
      );
      wrapper.simulate('change', { target: { value: 'Ny verdi' } });
      expect(verdi).toBe('Ny verdi');
    });

    test('Form.Textarea håndterer endringshendelser', () => {
      let verdi = '';
      const wrapper = shallow(
        <Form.Textarea
          value={verdi}
          onChange={(e) => {
            verdi = e.target.value;
          }}
          rows={3}
        />,
      );
      wrapper.simulate('change', { target: { value: 'Tekstområdeinnhold' } });
      expect(verdi).toBe('Tekstområdeinnhold');
    });

    test('Form.Checkbox håndterer av-/på-hendelser', () => {
      let sjekket = false;
      const wrapper = shallow(
        <Form.Checkbox
          checked={sjekket}
          label="Test avkrysningsboks"
          onChange={() => {
            sjekket = !sjekket;
          }}
        />,
      );
      wrapper.find('input[type="checkbox"]').simulate('change');
      expect(sjekket).toBe(true);
    });
  });

  describe('Button-komponenter', () => {
    test('Button.Success utløser onClick', () => {
      let klikket = false;
      const wrapper = shallow(
        <Button.Success onClick={() => (klikket = true)}>Suksess</Button.Success>,
      );
      wrapper.simulate('click');
      expect(klikket).toBe(true);
    });

    test('Button.Danger utløser onClick', () => {
      let klikket = false;
      const wrapper = shallow(<Button.Danger onClick={() => (klikket = true)}>Fare</Button.Danger>);
      wrapper.simulate('click');
      expect(klikket).toBe(true);
    });
  });

  describe('Alert-funksjoner', () => {
    test('Alert.success viser suksessmelding', () => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      Alert.success('Suksessmelding');
      expect(window.alert).toHaveBeenCalledWith('✅ Suksess: Suksessmelding');
    });

    test('Alert.danger viser feilmelding', () => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      Alert.danger('Feilmelding');
      expect(window.alert).toHaveBeenCalledWith('❌ Feil: Feilmelding');
    });
  });
});
