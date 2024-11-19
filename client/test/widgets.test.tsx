import * as React from 'react';
import { shallow } from 'enzyme';
import { Card, Row, Column, Form, Button, Alert } from '../src/components/widgets';

describe('Widgets Component Tests', () => {
  // Card Component Tests
  describe('Card Component', () => {
    test('renders with title and children', () => {
      const wrapper = shallow(<Card title="Test Title">Card Content</Card>);
      expect(wrapper.containsMatchingElement(<h2>Test Title</h2>)).toBe(true);
      expect(wrapper.containsMatchingElement(<div>Card Content</div>)).toBe(true);
    });

    test('renders without crashing when no title is provided', () => {
      const wrapper = shallow(<Card title="">Card Content</Card>);
      expect(wrapper.containsMatchingElement(<div>Card Content</div>)).toBe(true);
    });
  });

  // Row Component Tests
  describe('Row Component', () => {
    test('renders children in a flex container', () => {
      const wrapper = shallow(
        <Row>
          <div>Child 1</div>
          <div>Child 2</div>
        </Row>,
      );
      expect(wrapper.containsMatchingElement(<div>Child 1</div>)).toBe(true);
      expect(wrapper.containsMatchingElement(<div>Child 2</div>)).toBe(true);
    });
  });

  // Column Component Tests
  describe('Column Component', () => {
    test('renders with default width', () => {
      const wrapper = shallow(
        <Column>
          <div>Content</div>
        </Column>,
      );
      expect(wrapper.containsMatchingElement(<div>Content</div>)).toBe(true);
    });

    test('renders with custom width', () => {
      const wrapper = shallow(
        <Column width={5}>
          <div>Content</div>
        </Column>,
      );
      expect(wrapper.prop('style')).toHaveProperty('flex', '0 0 50%');
    });
  });

  // Form Component Tests
  describe('Form Components', () => {
    test('Form.Label renders correctly', () => {
      const wrapper = shallow(<Form.Label>Test Label</Form.Label>);
      expect(wrapper.containsMatchingElement(<label>Test Label</label>)).toBe(true);
    });

    test('Form.Input handles change events', () => {
      let value = '';
      const wrapper = shallow(
        <Form.Input
          type="text"
          value={value}
          onChange={(e) => {
            value = e.target.value;
          }}
        />,
      );
      wrapper.simulate('change', { target: { value: 'New Value' } });
      expect(value).toBe('New Value');
    });

    test('Form.Textarea handles change events', () => {
      let value = '';
      const wrapper = shallow(
        <Form.Textarea
          value={value}
          onChange={(e) => {
            value = e.target.value;
          }}
          rows={3}
        />,
      );
      wrapper.simulate('change', { target: { value: 'Textarea Content' } });
      expect(value).toBe('Textarea Content');
    });

    test('Form.Checkbox handles toggle events', () => {
      let checked = false;
      const wrapper = shallow(
        <Form.Checkbox
          checked={checked}
          label="Test Checkbox"
          onChange={() => {
            checked = !checked;
          }}
        />,
      );
      wrapper.find('input[type="checkbox"]').simulate('change');
      expect(checked).toBe(true);
    });
  });

  // Button Component Tests
  describe('Button Components', () => {
    test('Button.Success triggers onClick', () => {
      let clicked = false;
      const wrapper = shallow(
        <Button.Success onClick={() => (clicked = true)}>Success</Button.Success>,
      );
      wrapper.simulate('click');
      expect(clicked).toBe(true);
    });

    test('Button.Danger triggers onClick', () => {
      let clicked = false;
      const wrapper = shallow(
        <Button.Danger onClick={() => (clicked = true)}>Danger</Button.Danger>,
      );
      wrapper.simulate('click');
      expect(clicked).toBe(true);
    });
  });

  // Alert Function Tests
  describe('Alert Functions', () => {
    test('Alert.success displays success message', () => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      Alert.success('Success Message');
      expect(window.alert).toHaveBeenCalledWith('✅ Suksess: Success Message');
    });

    test('Alert.danger displays error message', () => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      Alert.danger('Error Message');
      expect(window.alert).toHaveBeenCalledWith('❌ Feil: Error Message');
    });
  });
});
