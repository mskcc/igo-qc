import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
// Plotly "createObjectURL not a Function" - https://github.com/plotly/react-plotly.js/issues/115#issuecomment-448688902
window.URL.createObjectURL = function() {};
// https://github.com/jsdom/jsdom/issues/1782#issuecomment-441582698
HTMLCanvasElement.prototype.getContext = jest.fn();
