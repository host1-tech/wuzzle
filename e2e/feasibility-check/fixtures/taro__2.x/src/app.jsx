import Taro, { Component } from '@tarojs/taro';
import Index from './pages/index';

class App extends Component {
  config = {
    pages: ['pages/index/index'],
  };

  render() {
    return <Index />;
  }
}

Taro.render(<App />, document.getElementById('app'));
